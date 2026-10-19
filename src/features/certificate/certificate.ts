export type CertificateTier = 'excellent' | 'good' | 'fair' | 'participation';

/** What the result block of the certificate reports. */
export type CertificateResult =
  | { kind: 'percent'; percent: number; score: number; maxScore: number }
  | { kind: 'exam'; score: number; maxScore: number; level: string | null };

export interface CertificateData {
  /** Stable per attempt, so the same paper always carries the same number. */
  number: string;
  recipient: string;
  testTitle: string;
  author: string;
  /** ISO time the paper was handed in. */
  issuedAt: string;
  tier: CertificateTier;
  /** Null when the test keeps its result hidden: the certificate then only attests the attempt. */
  result: CertificateResult | null;
}

/**
 * Every finished paper earns a certificate; the result only decides its
 * wording. The bands match the praise shown on the result screen.
 */
export function tierFor(percent: number): CertificateTier {
  if (percent >= 90) return 'excellent';
  if (percent >= 75) return 'good';
  if (percent >= 60) return 'fair';
  return 'participation';
}

export function resultPercent(result: CertificateResult): number {
  if (result.kind === 'percent') return result.percent;
  return result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
}

const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * `TH-` and eight characters derived from the attempt id. It is a reference
 * number, not a signature: checking one against a server is for the backend.
 */
export function certificateNumber(attemptId: string): string {
  let hash = 2166136261;
  for (let i = 0; i < attemptId.length; i += 1) {
    hash ^= attemptId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += ALPHABET[state % ALPHABET.length];
    // A second round of mixing, so neighbouring ids do not share a prefix.
    state = Math.imul(state ^ (state >>> 15), 2246822519) >>> 0;
    state = (state + Math.imul(i + 1, 3266489917)) >>> 0;
  }
  return `TH-${code}`;
}

export function buildCertificate(input: {
  attemptId: string;
  recipient: string;
  testTitle: string;
  author: string;
  issuedAt: string;
  result: CertificateResult | null;
}): CertificateData {
  return {
    number: certificateNumber(input.attemptId),
    recipient: input.recipient,
    testTitle: input.testTitle,
    author: input.author,
    issuedAt: input.issuedAt,
    tier: input.result ? tierFor(resultPercent(input.result)) : 'participation',
    result: input.result,
  };
}
