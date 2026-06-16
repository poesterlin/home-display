const attempts = new Map<string, { count: number; firstAttempt: number }>();

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

export function checkWithdrawalRate(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now - entry.firstAttempt > WINDOW_MS) {
      attempts.delete(ip);
    }
  }
}, 60_000).unref();
