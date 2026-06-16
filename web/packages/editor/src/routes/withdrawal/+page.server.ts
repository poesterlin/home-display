import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { validateForm } from '$lib/server/form';
import { checkWithdrawalRate } from '$lib/server/withdrawal-limiter';
import { getLookupErrorMessage, lookupPurchase } from '$lib/withdrawal/lookup';
import { confirmWithdrawal, hasActiveWithdrawal } from '$lib/withdrawal/process';
import { createWithdrawalToken, verifyWithdrawalToken } from '$lib/withdrawal/token';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const step = url.searchParams.get('step');
  const token = url.searchParams.get('token');

  if (step === 'confirm' && token) {
    const payload = await verifyWithdrawalToken(token);
    if (!payload) {
      return { step: 'identify' as const, purchase: null, error: 'Your session expired. Please start again.' };
    }

    const purchase = await lookupPurchase(payload.email, payload.stripeSessionId);
    if (!purchase) {
      return { step: 'identify' as const, purchase: null, error: getLookupErrorMessage() };
    }

    const duplicate = await hasActiveWithdrawal(purchase.stripeSessionId);
    if (duplicate) {
      return { step: 'success' as const, purchase: null, error: null, alreadySubmitted: true };
    }

    return {
      step: 'confirm' as const,
      purchase: {
        stripeSessionId: purchase.stripeSessionId,
        creditsPurchased: purchase.creditsPurchased,
        amountPaid: purchase.amountPaid,
        packName: purchase.packName,
        purchasedAt: purchase.purchasedAt.toISOString(),
        hasUsedCredits: purchase.hasUsedCredits,
        creditsConsumed: purchase.creditsConsumed,
        creditsRemainingEstimate: purchase.creditsRemainingEstimate,
      },
      token,
      error: null,
      alreadySubmitted: false,
    };
  }

  if (step === 'success') {
    return { step: 'success' as const, purchase: null, error: null, alreadySubmitted: false };
  }

  return { step: 'identify' as const, purchase: null, error: null, alreadySubmitted: false };
};

export const actions: Actions = {
  identify: validateForm(
    z.object({
      email: z.email().trim().transform((value) => value.toLowerCase()),
      orderId: z.string().trim().min(1, 'Order ID is required'),
    }),
    async (event, form) => {
      const ip = event.getClientAddress();
      if (!checkWithdrawalRate(ip)) {
        return fail(429, { message: 'Too many attempts. Please try again later.' });
      }

      const purchase = await lookupPurchase(form.email, form.orderId);
      if (!purchase) {
        return fail(400, { message: getLookupErrorMessage() });
      }

      const duplicate = await hasActiveWithdrawal(purchase.stripeSessionId);
      if (duplicate) {
        return { step: 'success', alreadySubmitted: true };
      }

      const token = await createWithdrawalToken(purchase.stripeSessionId, form.email);
      return { step: 'confirm', token };
    },
  ),

  confirm: validateForm(
    z.object({
      token: z.string().min(1),
    }),
    async (event, form) => {
      const ip = event.getClientAddress();
      if (!checkWithdrawalRate(ip)) {
        return fail(429, { message: 'Too many attempts. Please try again later.' });
      }

      const payload = await verifyWithdrawalToken(form.token);
      if (!payload) {
        return fail(400, { message: 'Your session expired. Please start again.' });
      }

      const purchase = await lookupPurchase(payload.email, payload.stripeSessionId);
      if (!purchase) {
        return fail(400, { message: getLookupErrorMessage() });
      }

      const result = await confirmWithdrawal(purchase, payload.email);
      if (!result.success) {
        if (result.reason === 'duplicate') {
          return { step: 'success', alreadySubmitted: true };
        }
        return fail(500, { message: 'Something went wrong. Please try again later.' });
      }

      return { step: 'success', alreadySubmitted: false };
    },
  ),
};
