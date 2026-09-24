const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Collision-safe enough identifier for client generated entities. */
export function uid(prefix = ''): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return prefix ? `${prefix}_${random}` : random;
}

/** Human friendly 6 digit code used to join live sessions. */
export function joinCode(): string {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

/** Short invite code (letters + digits, no lookalikes). */
export function inviteCode(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}
