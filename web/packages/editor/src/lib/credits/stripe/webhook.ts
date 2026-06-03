import { getStripe } from "./client";
import { addCredits } from "../credits";
import type Stripe from "stripe";

const trackedEvents = new Set<string>([
  "checkout.session.completed",
]);

export function isTrackedEvent(type: string): boolean {
  return trackedEvents.has(type);
}

export async function handleCompletedCheckout(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) return;

  if (session.mode !== "payment") return;
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return;

  const credits = session.metadata?.credits;
  if (!credits) return;

  const amount = parseInt(credits, 10);
  if (isNaN(amount) || amount <= 0) return;

  const priceKey = session.metadata?.price_key ?? "unknown";

  await addCredits({
    userId,
    amount,
    reason: `purchase:${priceKey}`,
    stripeSessionId: session.id,
  });
}

export async function processStripeEvent(
  body: string,
  signature: string,
  webhookSecret: string
): Promise<void> {
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  if (!isTrackedEvent(event.type)) return;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCompletedCheckout(session);
  }
}
