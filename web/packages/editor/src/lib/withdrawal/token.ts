import { env } from '$env/dynamic/private';
import { encodeBase64url } from '@oslojs/encoding';

const TOKEN_TTL_MS = 15 * 60_000;

interface WithdrawalTokenPayload {
  stripeSessionId: string;
  email: string;
  exp: number;
}

interface ListTokenPayload {
  email: string;
  exp: number;
}

function decodeBase64url(value: string): Uint8Array {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

function getSigningSecret(): string {
  return env.WITHDRAWAL_TOKEN_SECRET || env.STRIPE_WEBHOOK_SECRET || env.DATABASE_URL || 'dev-withdrawal-secret';
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signPayload(payload: object): Promise<string> {
  const body = encodeBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await importHmacKey(getSigningSecret());
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return `${body}.${encodeBase64url(new Uint8Array(signature))}`;
}

async function verifyPayload<T extends { exp: number }>(token: string): Promise<T | null> {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig) return null;

  const key = await importHmacKey(getSigningSecret());
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    decodeBase64url(sig) as BufferSource,
    new TextEncoder().encode(body),
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64url(body))) as T;
    if (Date.now() >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createListToken(email: string): Promise<string> {
  const payload: ListTokenPayload = {
    email: email.toLowerCase(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  return signPayload(payload);
}

export async function verifyListToken(token: string): Promise<ListTokenPayload | null> {
  const payload = await verifyPayload<ListTokenPayload>(token);
  if (!payload?.email) return null;
  return payload;
}

export async function createWithdrawalToken(stripeSessionId: string, email: string): Promise<string> {
  const payload: WithdrawalTokenPayload = {
    stripeSessionId,
    email: email.toLowerCase(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  return signPayload(payload);
}

export async function verifyWithdrawalToken(
  token: string,
): Promise<WithdrawalTokenPayload | null> {
  const payload = await verifyPayload<WithdrawalTokenPayload>(token);
  if (!payload?.stripeSessionId || !payload.email) return null;
  return payload;
}

