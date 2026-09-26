import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('keeps a named font size alongside a text color', () => {
    // Both belong to different groups; neither may drop the other.
    expect(cn('text-small text-danger')).toBe('text-small text-danger');
    expect(cn('text-primary', 'text-body')).toBe('text-primary text-body');
  });

  it('still resolves genuine conflicts', () => {
    expect(cn('text-body text-small')).toBe('text-small');
    expect(cn('text-text text-primary')).toBe('text-primary');
    expect(cn('bg-surface', 'bg-primary')).toBe('bg-primary');
  });
});
