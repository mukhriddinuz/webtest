import { describe, expect, it } from 'vitest';
import { parseScan } from './scan';

const ORIGIN = 'https://testhub.example';
const scan = (text: string) => parseScan(text, ORIGIN);

describe('parseScan — what the app understands', () => {
  it('reads a six digit join code', () => {
    expect(scan('482913')).toEqual({ kind: 'code', code: '482913' });
  });

  it('ignores whitespace around a code', () => {
    expect(scan('  482913\n')).toEqual({ kind: 'code', code: '482913' });
  });

  it('reads the link a live room prints', () => {
    expect(scan(`${ORIGIN}/live/live_history_demo`)).toEqual({
      kind: 'live',
      sessionId: 'live_history_demo',
    });
  });

  it('reads the link a test prints', () => {
    expect(scan(`${ORIGIN}/t/t_algebra`)).toEqual({ kind: 'test', testId: 't_algebra' });
  });

  it('tolerates a trailing slash, a query and a fragment', () => {
    expect(scan(`${ORIGIN}/t/t_algebra/?utm=x#top`)).toEqual({ kind: 'test', testId: 't_algebra' });
  });
});

describe('parseScan — what it refuses', () => {
  it.each([
    ['another origin', 'https://evil.example/t/t_algebra'],
    ['a look-alike origin', 'https://testhub.example.evil.example/t/t_algebra'],
    ['a userinfo trick', 'https://testhub.example@evil.example/t/t_algebra'],
    ['a different scheme on our host', 'http://testhub.example/t/t_algebra'],
    ['javascript:', 'javascript:alert(1)'],
    ['a data: url', 'data:text/html,<script>alert(1)</script>'],
    ['the host controls', `${ORIGIN}/live/live_x/host`],
    ['an admin route', `${ORIGIN}/admin`],
    ['an attempt route', `${ORIGIN}/t/t_algebra/attempt/att_1`],
    ['a nested path', `${ORIGIN}/t/a/b`],
    ['an empty id', `${ORIGIN}/t/`],
    ['plain text', 'hello world'],
    ['five digits', '48291'],
    ['seven digits', '4829133'],
    ['a code with letters', '48291a'],
    ['an empty string', ''],
    ['only whitespace', '   '],
  ])('rejects %s', (_label, text) => {
    expect(scan(text)).toEqual({ kind: 'unknown' });
  });

  it('rejects an encoded dot-dot that would climb out of the route', () => {
    expect(scan(`${ORIGIN}/t/%2e%2e`)).toEqual({ kind: 'unknown' });
    expect(scan(`${ORIGIN}/live/..%2fadmin`)).toEqual({ kind: 'unknown' });
  });

  it('rejects an id with characters a route would treat as structure', () => {
    expect(scan(`${ORIGIN}/t/a%3Fb`)).toEqual({ kind: 'unknown' });
    expect(scan(`${ORIGIN}/t/a%23b`)).toEqual({ kind: 'unknown' });
  });

  it('rejects malformed percent-encoding instead of throwing', () => {
    expect(scan(`${ORIGIN}/t/%E0%A4%A`)).toEqual({ kind: 'unknown' });
  });

  it('rejects an oversized payload without parsing it', () => {
    expect(scan(`${ORIGIN}/t/${'a'.repeat(5000)}`)).toEqual({ kind: 'unknown' });
  });

  it('rejects an id longer than any the app issues', () => {
    expect(scan(`${ORIGIN}/t/${'a'.repeat(65)}`)).toEqual({ kind: 'unknown' });
  });

  it('never returns the scanned string itself', () => {
    const result = scan(`${ORIGIN}/t/t_algebra?next=https://evil.example`);
    expect(JSON.stringify(result)).not.toContain('evil');
  });
});
