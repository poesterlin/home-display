import { encodeBase32LowerCase } from '@oslojs/encoding';

export function generateId() {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return encodeBase32LowerCase(bytes);
}

export function validateUsername(username: unknown): username is string {
  return typeof username === 'string' && username.length >= 3 && username.length <= 31;
}

export function validatePassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}
