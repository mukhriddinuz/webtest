import { describe, expect, it } from 'vitest';
import { buildCertificate, certificateNumber, resultPercent, tierFor } from './certificate';
import { certificateSvg, escapeXml, nameSize, wrapText, type CertificateText } from './render';

describe('tierFor', () => {
  it('follows the same bands as the praise on the result screen', () => {
    expect(tierFor(100)).toBe('excellent');
    expect(tierFor(90)).toBe('excellent');
    expect(tierFor(89.9)).toBe('good');
    expect(tierFor(75)).toBe('good');
    expect(tierFor(74.9)).toBe('fair');
    expect(tierFor(60)).toBe('fair');
  });

  it('still gives a certificate below the lowest band', () => {
    expect(tierFor(59.9)).toBe('participation');
    expect(tierFor(0)).toBe('participation');
  });
});

describe('certificateNumber', () => {
  it('has a fixed shape', () => {
    expect(certificateNumber('att_x1')).toMatch(/^TH-[0-9A-HJ-NP-Z]{8}$/);
  });

  it('is the same for the same attempt', () => {
    expect(certificateNumber('att_x1')).toBe(certificateNumber('att_x1'));
  });

  it('differs between attempts, even neighbouring ids', () => {
    const numbers = new Set(Array.from({ length: 500 }, (_, i) => certificateNumber(`att_${i}`)));
    expect(numbers.size).toBe(500);
  });
});

describe('buildCertificate', () => {
  const base = {
    attemptId: 'att_1',
    recipient: 'Jasur Toshmatov',
    testTitle: 'Algebra',
    author: 'Aziz Rahimov',
    issuedAt: '2026-10-19T10:00:00.000Z',
  };

  it('takes its tier from the percentage', () => {
    const data = buildCertificate({
      ...base,
      result: { kind: 'percent', percent: 82, score: 41, maxScore: 50 },
    });
    expect(data.tier).toBe('good');
  });

  it('takes an exam tier from the share of the maximum ball', () => {
    expect(resultPercent({ kind: 'exam', score: 150, maxScore: 189, level: null })).toBeCloseTo(
      79.4,
      1,
    );
    const data = buildCertificate({
      ...base,
      result: { kind: 'exam', score: 66, maxScore: 75, level: 'A' },
    });
    expect(data.tier).toBe('good');
  });

  it('only attests participation when the result is hidden', () => {
    const data = buildCertificate({ ...base, result: null });
    expect(data.tier).toBe('participation');
    expect(data.result).toBeNull();
  });

  it('does not divide by a zero maximum', () => {
    expect(resultPercent({ kind: 'exam', score: 0, maxScore: 0, level: null })).toBe(0);
  });
});

describe('wrapText', () => {
  it('breaks on words', () => {
    expect(wrapText('one two three four', 9, 3)).toEqual(['one two', 'three', 'four']);
  });

  it('cuts what does not fit with an ellipsis', () => {
    const lines = wrapText('aaa bbb ccc ddd eee fff', 7, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1]?.endsWith('…')).toBe(true);
    expect(lines.every((line) => line.length <= 7)).toBe(true);
  });

  it('shortens a single word longer than a line', () => {
    const [line] = wrapText('x'.repeat(100), 20, 2);
    expect(line).toHaveLength(20);
  });

  it('returns nothing for empty text', () => {
    expect(wrapText('   ', 20, 2)).toEqual([]);
  });
});

describe('certificateSvg', () => {
  const content: CertificateText = {
    brand: 'TestHub',
    title: 'SERTIFIKAT',
    certifies: 'Ushbu sertifikat',
    recipient: 'Jasur Toshmatov',
    body: '«Algebra» testini yakunlagani uchun beriladi.',
    tier: 'good',
    tierLabel: 'Yaxshi natija',
    detail: '82% · 41 / 50 ball',
    dateLabel: 'Berilgan sana',
    dateValue: '19-oktabr, 2026',
    authorLabel: 'Muallif',
    authorValue: 'Aziz Rahimov',
    numberLabel: 'Sertifikat raqami',
    numberValue: 'TH-ABCD1234',
  };

  it('carries the wording it was given', () => {
    const svg = certificateSvg(content);
    for (const part of ['SERTIFIKAT', 'Jasur Toshmatov', 'Yaxshi natija', '82%', 'TH-ABCD1234']) {
      expect(svg).toContain(part);
    }
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('undefined');
  });

  it('cannot be broken by markup in a name or a title', () => {
    const svg = certificateSvg({
      ...content,
      recipient: '<script>alert(1)</script> & "Co"',
      body: '«</text><circle/>» testi',
    });
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('</text><circle/>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('draws without a detail line when the result is hidden', () => {
    const svg = certificateSvg({ ...content, detail: null });
    expect(svg).not.toContain('41 / 50');
    expect(svg).toContain('Yaxshi natija');
  });

  it('shrinks long names', () => {
    expect(nameSize('Ali Vali')).toBeGreaterThan(
      nameSize('Muhammadjonov Abdurahmonjon Ibrohimovich'),
    );
  });
});

describe('escapeXml', () => {
  it('escapes the five characters that matter in markup', () => {
    expect(escapeXml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
