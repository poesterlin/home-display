import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createCheckoutSession } from "$lib/credits";
import { env } from "$env/dynamic/private";

export const POST: RequestHandler = async ({ request, locals, url }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceId, priceKey, credits } = await request.json();

    if (!priceId || !priceKey || !credits) {
      return json({ error: "Missing priceId, priceKey, or credits" }, { status: 400 });
    }

    const origin = url.origin;
    const session = await createCheckoutSession({
      userId: locals.user.id,
      priceId,
      priceKey,
      credits,
      username: locals.user.username,
      successUrl: `${origin}/account?checkout=success`,
      cancelUrl: `${origin}/account?checkout=cancelled`,
    });

    return json(session);
  } catch (err: any) {
    console.error("[stripe checkout]", err);
    return json({ error: err.message }, { status: 500 });
  }
};
