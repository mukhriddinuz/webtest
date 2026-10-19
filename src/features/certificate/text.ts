import type { TFunction } from 'i18next';
import { formatDate, formatDuration } from '@/lib/format';
import type { CertificateData } from './certificate';
import type { QrMatrix } from './ornaments';
import type { CertificateStat, CertificateText } from './render';

function statsFor(data: CertificateData, t: TFunction, locale: string): CertificateStat[] {
  const result = data.result;
  // A test that hides its result must not give it away here either.
  if (!result) return [];

  const upper = (key: string) => t(key).toLocaleUpperCase(locale);
  const stats: CertificateStat[] = [];

  if (result.kind === 'percent') {
    stats.push({ value: `${Math.round(result.percent)}%`, label: upper('certificate.statResult') });
  } else if (result.level) {
    stats.push({ value: result.level, label: upper('certificate.statLevel') });
  }
  stats.push({
    value: `${result.score} / ${result.maxScore}`,
    label: upper('certificate.statScore'),
  });
  if (data.durationSec !== undefined) {
    stats.push({ value: formatDuration(data.durationSec), label: upper('certificate.statTime') });
  }
  return stats;
}

/** The certificate's wording in the reader's language. */
export function certificateText(
  data: CertificateData,
  t: TFunction,
  locale: string,
  qr: QrMatrix | null,
): CertificateText {
  const upper = (key: string) => t(key).toLocaleUpperCase(locale);
  return {
    brand: upper('certificate.brand'),
    title: upper('certificate.title'),
    certifies: t('certificate.certifies'),
    recipient: data.recipient,
    body: t('certificate.body', { test: data.testTitle }),
    tier: data.tier,
    tierLabel: t(`certificate.tier.${data.tier}`),
    stats: statsFor(data, t, locale),
    dateLabel: upper('certificate.date'),
    dateValue: formatDate(data.issuedAt, locale),
    authorLabel: upper('certificate.author'),
    authorValue: data.author,
    numberLabel: upper('certificate.number'),
    numberValue: data.number,
    qr,
    qrCaption: t('certificate.qrCaption'),
  };
}
