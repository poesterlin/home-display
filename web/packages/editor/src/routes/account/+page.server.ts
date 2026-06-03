import { getBalance, CREDIT_COSTS } from "$lib/credits";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    return { balance: 0, checkoutStatus: null as string | null };
  }

  const balance = await getBalance(locals.user.id);
  const checkoutStatus = url.searchParams.get("checkout");

  return {
    balance,
    checkoutStatus,
    creditCosts: CREDIT_COSTS,
  };
};
