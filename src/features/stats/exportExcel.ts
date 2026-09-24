import type { ParticipantRow } from '@/services/api';
import type { Question, Test } from '@/services/types';
import { blocksToPlainText } from '@/lib/content';
import { downloadBlob } from '@/lib/importers';
import { formatDuration } from '@/lib/format';

/**
 * Builds a two-sheet workbook: a participant summary and a per-question answer
 * matrix. SheetJS is imported lazily so it stays out of the main bundle.
 */
export async function exportResultsWorkbook(input: {
  test: Test;
  questions: Question[];
  rows: ParticipantRow[];
}): Promise<void> {
  const XLSX = await import('xlsx');
  const { test, questions, rows } = input;

  const summaryHeader = ['#', 'Ism', 'Ball', 'Maksimal', 'Foiz', 'Vaqt', 'Chiqishlar', 'Holat'];
  const summary = rows.map((row, index) => {
    const timeSec = row.attempt.finishedAt
      ? Math.round(
          (new Date(row.attempt.finishedAt).getTime() - new Date(row.attempt.startedAt).getTime()) /
            1000,
        )
      : 0;
    return [
      index + 1,
      [row.user.firstName, row.user.lastName].filter(Boolean).join(' '),
      row.attempt.score,
      row.attempt.maxScore,
      Math.round(row.attempt.percent),
      formatDuration(timeSec),
      row.attempt.tabSwitches,
      row.attempt.status,
    ];
  });

  const answersHeader = [
    'Ism',
    ...questions.map(
      (question, index) => `${index + 1}. ${blocksToPlainText(question.content).slice(0, 40)}`,
    ),
  ];
  const answers = rows.map((row) => [
    [row.user.firstName, row.user.lastName].filter(Boolean).join(' '),
    ...questions.map((question) => {
      const answer = row.attempt.answers[question.id];
      if (!answer) return '';
      if (answer.value) return answer.value;
      return (answer.optionIds ?? [])
        .map((optionId) => {
          const index = question.options.findIndex((option) => option.id === optionId);
          return index === -1 ? '?' : String.fromCharCode(65 + index);
        })
        .join(', ');
    }),
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([summaryHeader, ...summary]),
    'Natijalar',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([answersHeader, ...answers]),
    'Javoblar',
  );

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeTitle = test.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'test';
  downloadBlob(blob, `${safeTitle}-natijalar.xlsx`);
}
