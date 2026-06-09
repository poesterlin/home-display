import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createCheckoutSession } from "$lib/credits";
import { getPackByPriceId } from "$lib/credits/packs";

export const POST: RequestHandler = async ({ request, locals, url }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const priceId = body.priceId;

    if (!priceId || typeof priceId !== "string") {
      return json({ error: "Missing priceId" }, { status: 400 });
    }

    if (!getPackByPriceId(priceId)) {
      return json({ error: "Unknown priceId" }, { status: 400 });
    }

    const origin = url.origin;
    const session = await createCheckoutSession({
      userId: locals.user.id,
      priceId,
      successUrl: `${origin}/credits?checkout=success`,
      cancelUrl: `${origin}/credits?checkout=cancelled`,
    });

    return json(session);
  } catch (err: any) {
    console.error("[stripe checkout]", err);
    return json({ error: "Failed to create checkout session" }, { status: 500 });
  }
};
