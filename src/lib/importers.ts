import type { ImportResult, ParsedQuestionDraft } from '@/services/types';
import { parseNumeric } from './grading';

/**
 * Question import/export. SheetJS is loaded on demand so it never lands in the
 * initial bundle. Error messages are i18n keys, resolved by the caller.
 */

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Text format: one block per question, separated by a blank line. The first
 * line of a block is the question and every following line is an option;
 * `*` marks the correct one (leading `-`/`+` bullets are ignored). A block with
 * a single line containing `=` becomes a free-text question whose accepted
 * answers follow the `=`, separated by `/`.
 */
export function parseTextFormat(source: string): ImportResult {
  const questions: ParsedQuestionDraft[] = [];
  const errors: { line: number; message: string }[] = [];

  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let block: { text: string; line: number; options: string[] } | null = null;

  const flush = () => {
    if (!block) return;
    const current = block;
    block = null;

    if (current.text.trim() === '') {
      errors.push({ line: current.line, message: 'import.errEmptyQuestion' });
      return;
    }

    // `Savol = javob` style declares a free-text question.
    const freeText = current.options.length === 0 && current.text.includes('=');
    if (freeText) {
      const [question, answers] = current.text.split('=');
      questions.push({
        type: 'text',
        text: (question ?? '').trim(),
        options: [],
        acceptedAnswers: (answers ?? '')
          .split('/')
          .map((value) => value.trim())
          .filter(Boolean),
        points: 1,
      });
      return;
    }

    if (current.options.length < 2) {
      errors.push({ line: current.line, message: 'import.errNoOptions' });
      return;
    }

    const options = current.options.map((raw) => ({
      text: raw.replace(/^\*/, '').trim(),
      isCorrect: raw.startsWith('*'),
    }));

    if (!options.some((option) => option.isCorrect)) {
      errors.push({ line: current.line, message: 'import.errNoCorrect' });
      return;
    }

    const correctCount = options.filter((option) => option.isCorrect).length;
    questions.push({
      type: correctCount > 1 ? 'multiple' : 'single',
      text: current.text.trim(),
      options,
      points: 1,
    });
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    if (line.trim() === '') {
      flush();
      return;
    }
    // Anything after the first line of a block is an option.
    if (block !== null) {
      block.options.push(line.trim().replace(/^[-+]\s*/, ''));
      return;
    }
    block = { text: line.trim(), line: index + 1, options: [] };
  });
  flush();

  return { questions, errors };
}

/* ---------------------------------- excel --------------------------------- */

interface SheetRow {
  [key: string]: string | number | undefined;
}

const TEMPLATE_HEADERS = [
  'savol',
  'variant_1',
  'variant_2',
  'variant_3',
  'variant_4',
  'togri',
  'ball',
];

function cell(row: SheetRow, key: string): string {
  const value = row[key];
  return value === undefined || value === null ? '' : String(value).trim();
}

/** Parses a workbook built from `templateWorkbook()`. */
export async function parseWorkbook(file: File): Promise<ImportResult> {
  const XLSX = await import('xlsx');
  const questions: ParsedQuestionDraft[] = [];
  const errors: { line: number; message: string }[] = [];

  let rows: SheetRow[] = [];
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
    if (!sheet) throw new Error('empty');
    rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: '' });
  } catch {
    return { questions: [], errors: [{ line: 0, message: 'import.errInvalidFile' }] };
  }

  rows.forEach((row, index) => {
    const line = index + 2; // header occupies row 1
    const questionText = cell(row, 'savol');
    if (questionText === '') return;

    const optionTexts = [1, 2, 3, 4, 5, 6]
      .map((n) => cell(row, `variant_${n}`))
      .filter((value) => value !== '');
    const correctRaw = cell(row, 'togri');
    const points = parseNumeric(cell(row, 'ball') || '1') ?? 1;

    if (optionTexts.length === 0) {
      // No options at all: treat `togri` as the accepted free-text answer.
      if (correctRaw === '') {
        errors.push({ line, message: 'import.errNoCorrect' });
        return;
      }
      const numeric = parseNumeric(correctRaw);
      questions.push(
        numeric === null
          ? {
              type: 'text',
              text: questionText,
              options: [],
              acceptedAnswers: correctRaw.split('/').map((value) => value.trim()),
              points,
            }
          : {
              type: 'numeric',
              text: questionText,
              options: [],
              numericAnswer: { value: numeric, tolerance: 0 },
              points,
            },
      );
      return;
    }

    if (optionTexts.length < 2) {
      errors.push({ line, message: 'import.errNoOptions' });
      return;
    }

    const correctIndexes = correctRaw
      .split(/[,;\s]+/)
      .map((token) => token.trim().toUpperCase())
      .filter(Boolean)
      .map((token) => {
        const letterIndex = LETTERS.indexOf(token);
        if (letterIndex !== -1) return letterIndex;
        const numberIndex = Number(token) - 1;
        return Number.isInteger(numberIndex) ? numberIndex : -1;
      })
      .filter((value) => value >= 0 && value < optionTexts.length);

    if (correctIndexes.length === 0) {
      errors.push({ line, message: 'import.errNoCorrect' });
      return;
    }

    questions.push({
      type: correctIndexes.length > 1 ? 'multiple' : 'single',
      text: questionText,
      options: optionTexts.map((optionText, optionIndex) => ({
        text: optionText,
        isCorrect: correctIndexes.includes(optionIndex),
      })),
      points,
    });
  });

  return { questions, errors };
}

/** Downloadable template with two filled example rows. */
export async function templateWorkbook(): Promise<Blob> {
  const XLSX = await import('xlsx');
  const rows = [
    TEMPLATE_HEADERS,
    ["O'zbekiston poytaxti qaysi shahar?", 'Toshkent', 'Samarqand', 'Buxoro', 'Xiva', 'A', '1'],
    ['2 + 2 * 2 = ?', '', '', '', '', '6', '2'],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Savollar');
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** Triggers a browser download for a generated file. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
