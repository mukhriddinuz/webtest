import { describe, expect, it } from 'vitest';
import { parseTextFormat } from './importers';

describe('parseTextFormat', () => {
  it('reads a single-answer question', () => {
    const result = parseTextFormat(
      ["O'zbekiston poytaxti?", '*Toshkent', 'Samarqand', 'Buxoro'].join('\n'),
    );
    expect(result.errors).toHaveLength(0);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]?.type).toBe('single');
    expect(result.questions[0]?.options.filter((option) => option.isCorrect)).toHaveLength(1);
  });

  it('detects multiple correct answers', () => {
    const result = parseTextFormat(['Tub sonlarni tanlang', '*13', '*17', '21'].join('\n'));
    expect(result.questions[0]?.type).toBe('multiple');
  });

  it('separates questions on blank lines', () => {
    const source = ['Savol 1', '*A', 'B', '', 'Savol 2', '*C', 'D'].join('\n');
    const result = parseTextFormat(source);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[1]?.text).toBe('Savol 2');
  });

  it('accepts indented options', () => {
    const result = parseTextFormat(['Savol', '  *To‘g‘ri', '  Noto‘g‘ri'].join('\n'));
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]?.options).toHaveLength(2);
  });

  it('reports a question with no correct option', () => {
    const result = parseTextFormat(['Savol', 'A', 'B'].join('\n'));
    expect(result.questions).toHaveLength(0);
    expect(result.errors[0]?.message).toBe('import.errNoCorrect');
  });

  it('reports a question with too few options', () => {
    const result = parseTextFormat(['Savol', '*A'].join('\n'));
    expect(result.errors[0]?.message).toBe('import.errNoOptions');
  });

  it('builds a free-text question from the `=` form', () => {
    const result = parseTextFormat('Poytaxt qaysi shahar? = Toshkent / Tashkent');
    expect(result.questions[0]?.type).toBe('text');
    expect(result.questions[0]?.acceptedAnswers).toEqual(['Toshkent', 'Tashkent']);
  });

  it('keeps the line number of a broken block', () => {
    const source = ['Savol 1', '*A', 'B', '', 'Savol 2', 'C', 'D'].join('\n');
    const result = parseTextFormat(source);
    expect(result.questions).toHaveLength(1);
    expect(result.errors[0]?.line).toBe(5);
  });
});
