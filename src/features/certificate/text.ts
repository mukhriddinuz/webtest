import type { TFunction } from 'i18next';
import { formatDate } from '@/lib/format';
import type { CertificateData } from './certificate';
import type { CertificateText } from './render';

function detailFor(data: CertificateData, t: TFunction): string | null {
  const result = data.result;
  if (!result) return null;
  if (result.kind === 'percent') {
    return t('certificate.detailPercent', {
      percent: Math.round(result.percent),
      score: result.score,
      max: result.maxScore,
    });
  }
  return result.level
    ? t('certificate.detailExamLevel', {
        level: result.level,
        score: result.score,
        max: result.maxScore,
      })
    : t('certificate.detailExam', { score: result.score, max: result.maxScore });
}

/** The certificate's wording in the reader's language. */
export function certificateText(
  data: CertificateData,
  t: TFunction,
  locale: string,
): CertificateText {
  return {
    brand: t('certificate.brand').toLocaleUpperCase(locale),
    title: t('certificate.title').toLocaleUpperCase(locale),
    certifies: t('certificate.certifies'),
    recipient: data.recipient,
    body: t('certificate.body', { test: data.testTitle }),
    tier: data.tier,
    tierLabel: t(`certificate.tier.${data.tier}`),
    detail: detailFor(data, t),
    dateLabel: t('certificate.date'),
    dateValue: formatDate(data.issuedAt, locale),
    authorLabel: t('certificate.author'),
    authorValue: data.author,
    numberLabel: t('certificate.number'),
    numberValue: data.number,
  };
}
