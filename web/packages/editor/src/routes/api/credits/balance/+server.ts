import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getBalance } from "$lib/credits";

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const balance = await getBalance(locals.user.id);
  return json({ balance });
};
