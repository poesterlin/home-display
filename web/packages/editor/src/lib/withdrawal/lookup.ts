import { getDb } from '@esphome-designer/db';
import { creditBalances, creditTransactions, usersTable } from '@esphome-designer/db/schema';
import { CREDIT_PACKS } from '$lib/credits/packs';
import { and, eq, gt, lt, sql } from 'drizzle-orm';

export interface PurchaseLookupResult {
  stripeSessionId: string;
  userId: string;
  email: string;
  creditsPurchased: number;
  amountPaid: number;
  packName: string;
  purchasedAt: Date;
  creditsConsumed: number;
  creditsRemainingEstimate: number;
  hasUsedCredits: boolean;
}

const GENERIC_ERROR = 'No matching order found. Check your email and order ID and try again.';

export function getLookupErrorMessage(): string {
  return GENERIC_ERROR;
}

function getPackInfo(credits: number) {
  const pack = CREDIT_PACKS.find((p) => p.credits === credits);
  if (pack) {
    return { amountPaid: pack.price, packName: pack.name };
  }
  return { amountPaid: 0, packName: `${credits} credits` };
}

export async function lookupPurchase(
  email: string,
  stripeSessionId: string,
): Promise<PurchaseLookupResult | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedSessionId = stripeSessionId.trim();

  if (!normalizedEmail || !normalizedSessionId.startsWith('cs_')) {
    return null;
  }

  const db = getDb();

  const [row] = await db
    .select({
      transaction: creditTransactions,
      user: {
        id: usersTable.id,
        email: usersTable.email,
      },
    })
    .from(creditTransactions)
    .innerJoin(usersTable, eq(creditTransactions.userId, usersTable.id))
    .where(
      and(
        eq(creditTransactions.stripeSessionId, normalizedSessionId),
        sql`lower(${usersTable.email}) = ${normalizedEmail}`,
      ),
    )
    .limit(1);

  if (!row || row.transaction.amount <= 0) {
    return null;
  }

  const creditsPurchased = row.transaction.amount;
  const { amountPaid, packName } = getPackInfo(creditsPurchased);

  const [usage] = await db
    .select({
      consumed: sql<number>`coalesce(sum(abs(${creditTransactions.amount})), 0)`.mapWith(Number),
    })
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.userId, row.user.id),
        lt(creditTransactions.amount, 0),
        gt(creditTransactions.createdAt, row.transaction.createdAt),
      ),
    );

  const creditsConsumed = Math.min(usage?.consumed ?? 0, creditsPurchased);
  const [balanceRow] = await db
    .select({ balance: creditBalances.balance })
    .from(creditBalances)
    .where(eq(creditBalances.userId, row.user.id));

  const currentBalance = balanceRow?.balance ?? 0;
  const creditsRemainingEstimate = Math.min(currentBalance, creditsPurchased - creditsConsumed);

  return {
    stripeSessionId: normalizedSessionId,
    userId: row.user.id,
    email: row.user.email,
    creditsPurchased,
    amountPaid,
    packName,
    purchasedAt: row.transaction.createdAt,
    creditsConsumed,
    creditsRemainingEstimate,
    hasUsedCredits: creditsConsumed > 0,
  };
}
