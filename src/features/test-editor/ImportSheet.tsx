import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import type { ImportResult, ParsedQuestionDraft, Question } from '@/services/types';
import { downloadBlob, parseTextFormat, parseWorkbook, templateWorkbook } from '@/lib/importers';
import { uid } from '@/lib/id';
import { toast } from '@/store/toast';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { Textarea } from '@/components/Textarea';

type ImportTab = 'excel' | 'text';

export interface ImportSheetProps {
  open: boolean;
  testId: string;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
}

/** Converts a parsed draft into a real question of this test. */
function toQuestion(draft: ParsedQuestionDraft, testId: string, order: number): Question {
  return {
    id: uid('q'),
    testId,
    order,
    type: draft.type,
    content: [{ id: uid('b'), type: 'text', value: draft.text }],
    options: draft.options.map((option) => ({
      id: uid('o'),
      content: [{ id: uid('b'), type: 'text' as const, value: option.text }],
      isCorrect: option.isCorrect,
    })),
    acceptedAnswers: draft.acceptedAnswers ?? [],
    numericAnswer: draft.numericAnswer,
    points: draft.points,
  };
}

export function ImportSheet({ open, testId, onClose, onImport }: ImportSheetProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ImportTab>('text');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setResult(null);
    setSource('');
  };

  const handleTemplate = async () => {
    setBusy(true);
    try {
      const blob = await templateWorkbook();
      downloadBlob(blob, 'testhub-shablon.xlsx');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      setResult(await parseWorkbook(file));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirm = () => {
    if (!result || result.questions.length === 0) return;
    onImport(result.questions.map((draft, index) => toQuestion(draft, testId, index)));
    toast.success(t('import.parsedCount', { count: result.questions.length }));
    reset();
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      tall
      title={t('import.title')}
      closeLabel={t('common.close')}
      footer={
        <Button fullWidth disabled={!result || result.questions.length === 0} onClick={confirm}>
          {t('import.confirm')}
          {result && result.questions.length > 0 ? ` (${result.questions.length})` : ''}
        </Button>
      }
    >
      <Tabs<ImportTab>
        className="mb-4"
        value={tab}
        onChange={(next) => {
          setTab(next);
          reset();
        }}
        items={[
          { value: 'text', label: t('import.tabText') },
          { value: 'excel', label: t('import.tabExcel') },
        ]}
      />

      {tab === 'text' ? (
        <div className="flex flex-col gap-3">
          <Textarea
            rows={10}
            value={source}
            hint={t('import.textHint')}
            placeholder={t('import.textPlaceholder')}
            className="font-mono text-small"
            onChange={(event) => setSource(event.target.value)}
          />
          <Button
            variant="secondary"
            disabled={source.trim() === ''}
            onClick={() => setResult(parseTextFormat(source))}
          >
            {t('import.parse')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <Button
            variant="secondary"
            loading={busy}
            icon={<Download size={16} strokeWidth={1.75} />}
            onClick={() => void handleTemplate()}
          >
            {t('import.downloadTemplate')}
          </Button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface-muted text-text-muted transition-colors duration-150 hover:border-primary/50 hover:text-text"
          >
            <FileSpreadsheet size={22} strokeWidth={1.5} />
            <span className="text-small">{t('import.selectFile')}</span>
            <Upload size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {result && (
        <section className="mt-4 flex flex-col gap-2">
          <p className="text-body text-text">
            {t('import.parsedCount', { count: result.questions.length })}
          </p>
          {result.errors.length > 0 && (
            <div className="rounded-card bg-danger-soft p-3">
              <p className="mb-1 flex items-center gap-1.5 text-small font-medium text-danger">
                <AlertTriangle size={14} strokeWidth={2} />
                {t('import.errorsCount', { count: result.errors.length })}
              </p>
              <ul className="flex flex-col gap-0.5 text-small text-danger">
                {result.errors.map((error, index) => (
                  <li key={index}>
                    {t('import.lineError', { line: error.line, message: t(error.message) })}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.questions.length === 0 && (
            <p className="text-small text-text-muted">{t('import.nothingFound')}</p>
          )}
          <ul className="flex flex-col gap-1.5">
            {result.questions.slice(0, 20).map((question, index) => (
              <li
                key={index}
                className="rounded-control border border-border bg-surface px-3 py-2 text-small text-text"
              >
                <span className="tnum mr-2 text-text-muted">{index + 1}.</span>
                {question.text}
                <span className="ml-2 text-text-muted">({t(`questionType.${question.type}`)})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </BottomSheet>
  );
}
