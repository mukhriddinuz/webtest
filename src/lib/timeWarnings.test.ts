import { describe, expect, it } from 'vitest';
import { crossedThreshold, inWarningStage, warningThresholds } from './timeWarnings';

describe('warningThresholds', () => {
  it('warns at ten and five minutes on a long paper', () => {
    expect(warningThresholds(180 * 60)).toEqual([600, 300]);
  });

  it('skips a warning that would fire almost at the start', () => {
    // 20 minutes: ten left is exactly half-way, five left is fine.
    expect(warningThresholds(20 * 60)).toEqual([600, 300]);
    // 15 minutes: "ten left" would come after only five minutes.
    expect(warningThresholds(15 * 60)).toEqual([300]);
  });

  it('gives no warning on a very short quiz', () => {
    expect(warningThresholds(8 * 60)).toEqual([]);
  });
});

describe('crossedThreshold', () => {
  const marks = [600, 300];

  it('fires as the clock passes a mark', () => {
    expect(crossedThreshold(601, 600, marks)).toBe(600);
    expect(crossedThreshold(302, 299, marks)).toBe(300);
  });

  it('does not fire again once past it', () => {
    expect(crossedThreshold(600, 599, marks)).toBeNull();
  });

  it('stays quiet on the very first reading', () => {
    // Opening a paper with four minutes left must not announce the five-minute mark.
    expect(crossedThreshold(null, 240, marks)).toBeNull();
  });

  it('catches a mark that a throttled tab skipped over', () => {
    expect(crossedThreshold(650, 580, marks)).toBe(600);
  });

  it('reports the larger mark when two were crossed at once', () => {
    expect(crossedThreshold(700, 200, marks)).toBe(600);
  });
});

describe('inWarningStage', () => {
  it('starts at the earliest applicable mark', () => {
    expect(inWarningStage(601, 180 * 60)).toBe(false);
    expect(inWarningStage(600, 180 * 60)).toBe(true);
  });

  it('never applies to a paper too short for warnings', () => {
    expect(inWarningStage(100, 8 * 60)).toBe(false);
  });
});
