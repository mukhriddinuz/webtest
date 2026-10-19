import { describe, expect, it } from 'vitest';
import { buildCertificate, certificateNumber, resultPercent, tierFor } from './certificate';
import { backdrop, divider, frame, logoMark, qrPath, qrScale, ribbon, seal } from './ornaments';
import { THEMES } from './palette';
import {
  certificateSvg,
  escapeXml,
  nameSize,
  qrMatrix,
  signatureSize,
  wrapText,
  type CertificateText,
} from './render';

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
    brand: 'TESTHUB',
    title: 'SERTIFIKAT',
    certifies: 'Ushbu sertifikat',
    recipient: 'Jasur Toshmatov',
    body: '«Algebra» testini yakunlagani uchun beriladi.',
    tier: 'good',
    tierLabel: 'Yaxshi natija',
    stats: [
      { value: '82%', label: 'NATIJA' },
      { value: '41 / 50', label: 'BALL' },
      { value: '04:49', label: 'VAQT' },
    ],
    dateLabel: 'BERILGAN SANA',
    dateValue: '19-oktabr, 2026',
    authorLabel: 'MUALLIF',
    authorValue: 'Aziz Rahimov',
    numberLabel: 'SERTIFIKAT RAQAMI',
    numberValue: 'TH-ABCD1234',
    qr: { size: 2, dark: [true, true, false, true] },
    qrCaption: 'Testni ochish uchun skanerlang',
  };

  const wellFormed = (svg: string) => {
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    return document.getElementsByTagName('parsererror').length === 0;
  };

  it('carries the wording it was given', () => {
    const svg = certificateSvg(content);
    for (const part of ['SERTIFIKAT', 'Jasur Toshmatov', 'Yaxshi natija', '82%', 'TH-ABCD1234']) {
      expect(svg).toContain(part);
    }
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('undefined');
  });

  it('is well-formed in every tier, with and without figures and code', () => {
    for (const tier of ['excellent', 'good', 'fair', 'participation'] as const) {
      for (const stats of [content.stats, content.stats.slice(0, 1), []]) {
        for (const qr of [content.qr, null]) {
          const svg = certificateSvg({ ...content, tier, stats, qr });
          expect(wellFormed(svg), `${tier} ${stats.length} ${qr ? 'qr' : 'no qr'}`).toBe(true);
          expect(svg).not.toContain('NaN');
        }
      }
    }
  });

  it('cannot be broken by markup in a name, a title or an author', () => {
    const svg = certificateSvg({
      ...content,
      recipient: '<script>alert(1)</script> & "Co"',
      body: '«</text><circle/>» testi',
      authorValue: '<b>x</b>',
    });
    expect(wellFormed(svg)).toBe(true);
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('</text><circle/>');
    expect(svg).not.toContain('<b>x</b>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('leaves out the figures when the result is hidden', () => {
    const svg = certificateSvg({ ...content, stats: [] });
    expect(svg).not.toContain('41 / 50');
    expect(svg).not.toContain('82%');
    expect(svg).toContain('Yaxshi natija');
  });

  it('leaves out the code when it could not be made', () => {
    expect(certificateSvg({ ...content, qr: null })).not.toContain('Testni ochish');
  });

  it('shrinks long names and signatures', () => {
    expect(nameSize('Ali Vali')).toBeGreaterThan(
      nameSize('Muhammadjonov Abdurahmonjon Ibrohimovich'),
    );
    expect(signatureSize('Aziz')).toBeGreaterThan(signatureSize('Muhammadjonov Abdurahmonjon'));
  });
});

describe('qr', () => {
  it('draws runs of dark modules as rectangles', () => {
    expect(qrPath({ size: 2, dark: [true, true, false, true] })).toBe('M0 0h2v1h-2zM1 1h1v1h-1z');
    expect(qrPath({ size: 2, dark: [false, false, false, false] })).toBe('');
  });

  it('picks a whole number of pixels per module', () => {
    expect(qrScale({ size: 29, dark: [] }, 84)).toBe(2);
    expect(qrScale({ size: 21, dark: [] }, 84)).toBe(4);
    expect(qrScale({ size: 200, dark: [] }, 84)).toBe(2);
  });

  it('makes a square matrix for an address', async () => {
    const matrix = await qrMatrix('https://example.com/t/t_algebra');
    expect(matrix).not.toBeNull();
    expect(matrix!.size).toBeGreaterThanOrEqual(21);
    expect(matrix!.dark).toHaveLength(matrix!.size ** 2);
    expect(matrix!.dark.some(Boolean)).toBe(true);
  });
});

describe('ornaments', () => {
  it('draws the divider line in a plain colour', () => {
    // A gradient on a perfectly horizontal line has no height to spread over,
    // and SVG then draws nothing at all.
    const line = divider(707, 298, 150, THEMES.good).match(/<path d="M[^"]*H[^"]*"[^>]*>/)?.[0];
    expect(line).toBeDefined();
    expect(line).not.toContain('url(#');
  });

  it('produce clean coordinates for every theme', () => {
    for (const theme of Object.values(THEMES)) {
      const drawing = [
        frame(1414, 1000, theme),
        backdrop(1414, 1000, theme),
        divider(707, 292, 150, theme),
        ribbon(707, 584, 520, theme),
        seal(236, 818, 54, 'star', theme),
        seal(236, 818, 54, 'check', theme),
        logoMark(140, 122, 56, theme),
      ].join('');
      expect(drawing).not.toContain('NaN');
      expect(drawing).not.toContain('undefined');
      expect(drawing).not.toContain('Infinity');
    }
  });
});

describe('escapeXml', () => {
  it('escapes the five characters that matter in markup', () => {
    expect(escapeXml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
