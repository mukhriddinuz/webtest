import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { buildCertificate } from './certificate';
import { certificateText } from './text';

const t = i18n.getFixedT('uz');

const base = {
  attemptId: 'att_1',
  recipient: 'Jasur Toshmatov',
  testTitle: 'Algebra',
  author: 'Aziz Rahimov',
  issuedAt: '2026-10-19T10:00:00.000Z',
  durationSec: 289,
};

describe('certificateText', () => {
  it('lists result, score and time for an ordinary test', () => {
    const data = buildCertificate({
      ...base,
      result: { kind: 'percent', percent: 82.4, score: 41, maxScore: 50 },
    });
    const { stats, tierLabel, title } = certificateText(data, t, 'uz', null);
    expect(stats.map((stat) => stat.value)).toEqual(['82%', '41 / 50', '04:49']);
    expect(stats.map((stat) => stat.label)).toEqual(['NATIJA', 'BALL', 'VAQT']);
    expect(tierLabel).toBe('Yaxshi natija');
    expect(title).toBe('SERTIFIKAT');
  });

  it('leads with the level for an exam that reports one', () => {
    const data = buildCertificate({
      ...base,
      result: { kind: 'exam', score: 66, maxScore: 75, level: 'A' },
    });
    expect(certificateText(data, t, 'uz', null).stats.map((stat) => stat.value)).toEqual([
      'A',
      '66 / 75',
      '04:49',
    ]);
  });

  it('shows only the ball for an exam below every level', () => {
    const data = buildCertificate({
      ...base,
      result: { kind: 'exam', score: 30, maxScore: 75, level: null },
    });
    expect(certificateText(data, t, 'uz', null).stats.map((stat) => stat.value)).toEqual([
      '30 / 75',
      '04:49',
    ]);
  });

  it('skips the time when it is not known', () => {
    const data = buildCertificate({
      ...base,
      durationSec: undefined,
      result: { kind: 'percent', percent: 50, score: 5, maxScore: 10 },
    });
    expect(certificateText(data, t, 'uz', null).stats).toHaveLength(2);
  });

  it('gives no figures at all when the result is hidden', () => {
    const data = buildCertificate({ ...base, result: null });
    const text = certificateText(data, t, 'uz', null);
    expect(text.stats).toEqual([]);
    expect(text.tier).toBe('participation');
  });

  it('speaks Russian when asked to', () => {
    const data = buildCertificate({
      ...base,
      result: { kind: 'percent', percent: 95, score: 19, maxScore: 20 },
    });
    const text = certificateText(data, i18n.getFixedT('ru'), 'ru', null);
    expect(text.title).toBe('СЕРТИФИКАТ');
    expect(text.tierLabel).toBe('Отличный результат');
    expect(text.stats[0]?.label).toBe('РЕЗУЛЬТАТ');
  });
});
