import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Plus, Sigma, Trash2, Type, X } from 'lucide-react';
import type { AnswerOption, ContentBlock, Question, QuestionType } from '@/services/types';
import { uid } from '@/lib/id';
import { parseNumeric } from '@/lib/grading';
import { cn } from '@/lib/cn';
import { BottomSheet } from '@/components/BottomSheet';
import { Button, IconButton } from '@/components/Button';
import { FormulaInput } from '@/components/FormulaInput';
import { Input } from '@/components/Input';
import { QuestionView } from '@/components/QuestionView';
import { Select } from '@/components/Select';
import { ContentBlockEditor } from './ContentBlockEditor';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

export interface QuestionEditorSheetProps {
  open: boolean;
  question: Question | null;
  /** Live tests require a per-question timer. */
  requireTimeLimit?: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
}

export function QuestionEditorSheet({
  open,
  question,
  requireTimeLimit,
  onClose,
  onSave,
}: QuestionEditorSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Question | null>(question);
  const [preview, setPreview] = useState(false);
  const [acceptedInput, setAcceptedInput] = useState('');

  useEffect(() => {
    setDraft(question);
    setPreview(false);
    setAcceptedInput('');
  }, [question]);

  if (!draft) return null;

  const patch = (next: Partial<Question>) => setDraft({ ...draft, ...next });

  const changeType = (type: QuestionType) => {
    const needsOptions = type === 'single' || type === 'multiple';
    patch({
      type,
      options: needsOptions
        ? draft.options.length >= MIN_OPTIONS
          ? type === 'single'
            ? keepSingleCorrect(draft.options)
            : draft.options
          : createOptions(MIN_OPTIONS)
        : [],
      acceptedAnswers: type === 'text' ? draft.acceptedAnswers : [],
      numericAnswer:
        type === 'numeric' ? (draft.numericAnswer ?? { value: 0, tolerance: 0 }) : undefined,
    });
  };

  const setOption = (id: string, next: AnswerOption) =>
    patch({ options: draft.options.map((option) => (option.id === id ? next : option)) });

  const toggleCorrect = (id: string) => {
    patch({
      options: draft.options.map((option) =>
        option.id === id
          ? { ...option, isCorrect: draft.type === 'single' ? true : !option.isCorrect }
          : draft.type === 'single'
            ? { ...option, isCorrect: false }
            : option,
      ),
    });
  };

  const addAccepted = () => {
    const value = acceptedInput.trim();
    if (value === '' || draft.acceptedAnswers.includes(value)) return;
    patch({ acceptedAnswers: [...draft.acceptedAnswers, value] });
    setAcceptedInput('');
  };

  const isChoice = draft.type === 'single' || draft.type === 'multiple';
  const canSave =
    (!isChoice || draft.options.some((option) => option.isCorrect)) &&
    (draft.type !== 'text' || draft.acceptedAnswers.length > 0) &&
    (draft.type !== 'numeric' || Boolean(draft.numericAnswer));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      tall
      title={t('editor.title')}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button
            variant="secondary"
            className="shrink-0"
            icon={
              preview ? (
                <Pencil size={16} strokeWidth={1.75} />
              ) : (
                <Eye size={16} strokeWidth={1.75} />
              )
            }
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? t('editor.editView') : t('editor.participantView')}
          </Button>
          <Button fullWidth disabled={!canSave} onClick={() => onSave(draft)}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      {preview ? (
        <div className="card p-4">
          <QuestionView question={draft} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Select
            label={t('editor.type')}
            value={draft.type}
            onChange={(event) => changeType(event.target.value as QuestionType)}
            options={(['single', 'multiple', 'text', 'numeric'] as QuestionType[]).map((type) => ({
              value: type,
              label: t(`questionType.${type}`),
            }))}
          />

          <section>
            <h3 className="mb-2 text-small font-medium text-text-muted">{t('editor.content')}</h3>
            <ContentBlockEditor blocks={draft.content} onChange={(content) => patch({ content })} />
          </section>

          {isChoice && (
            <section>
              <h3 className="mb-2 text-small font-medium text-text-muted">{t('editor.options')}</h3>
              <div className="flex flex-col gap-2">
                {draft.options.map((option, index) => (
                  <OptionRow
                    key={option.id}
                    option={option}
                    index={index}
                    multiple={draft.type === 'multiple'}
                    canRemove={draft.options.length > MIN_OPTIONS}
                    onChange={(next) => setOption(option.id, next)}
                    onToggleCorrect={() => toggleCorrect(option.id)}
                    onRemove={() =>
                      patch({ options: draft.options.filter((item) => item.id !== option.id) })
                    }
                  />
                ))}
              </div>
              <Button
                className="mt-2"
                size="sm"
                variant="secondary"
                icon={<Plus size={15} strokeWidth={1.75} />}
                disabled={draft.options.length >= MAX_OPTIONS}
                onClick={() =>
                  patch({ options: [...draft.options, createOptions(1)[0] as AnswerOption] })
                }
              >
                {t('editor.addOption')}
              </Button>
              {draft.options.length >= MAX_OPTIONS && (
                <p className="mt-1 text-small text-text-muted">{t('editor.maxOptions')}</p>
              )}
            </section>
          )}

          {draft.type === 'text' && (
            <section>
              <h3 className="mb-2 text-small font-medium text-text-muted">
                {t('editor.acceptedAnswers')}
              </h3>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {draft.acceptedAnswers.map((answer) => (
                  <span
                    key={answer}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-small text-primary"
                  >
                    {answer}
                    <button
                      type="button"
                      aria-label={t('common.remove')}
                      onClick={() =>
                        patch({
                          acceptedAnswers: draft.acceptedAnswers.filter((item) => item !== answer),
                        })
                      }
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={acceptedInput}
                  placeholder={t('editor.acceptedPlaceholder')}
                  hint={t('editor.acceptedHint')}
                  onChange={(event) => setAcceptedInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addAccepted();
                    }
                  }}
                />
                <Button className="shrink-0 self-start" variant="secondary" onClick={addAccepted}>
                  {t('common.add')}
                </Button>
              </div>
            </section>
          )}

          {draft.type === 'numeric' && (
            <section className="grid grid-cols-2 gap-2">
              <Input
                label={t('editor.numericValue')}
                inputMode="decimal"
                className="tnum"
                value={draft.numericAnswer?.value ?? ''}
                onChange={(event) =>
                  patch({
                    numericAnswer: {
                      value: parseNumeric(event.target.value) ?? 0,
                      tolerance: draft.numericAnswer?.tolerance ?? 0,
                    },
                  })
                }
              />
              <Input
                label={t('editor.numericTolerance')}
                inputMode="decimal"
                className="tnum"
                value={draft.numericAnswer?.tolerance ?? 0}
                onChange={(event) =>
                  patch({
                    numericAnswer: {
                      value: draft.numericAnswer?.value ?? 0,
                      tolerance: Math.abs(parseNumeric(event.target.value) ?? 0),
                    },
                  })
                }
              />
            </section>
          )}

          <section className="grid grid-cols-2 gap-2">
            <Input
              label={t('editor.points')}
              inputMode="decimal"
              className="tnum"
              value={draft.points}
              onChange={(event) =>
                patch({ points: Math.max(0, parseNumeric(event.target.value) ?? 1) })
              }
            />
            {requireTimeLimit && (
              <Input
                label={t('editor.timeLimit')}
                inputMode="numeric"
                className="tnum"
                value={draft.timeLimitSec ?? 20}
                onChange={(event) =>
                  patch({
                    timeLimitSec: Math.max(5, Math.round(parseNumeric(event.target.value) ?? 20)),
                  })
                }
              />
            )}
          </section>

          <section>
            <h3 className="mb-2 text-small font-medium text-text-muted">
              {t('editor.explanation')}
            </h3>
            <ContentBlockEditor
              blocks={draft.explanation ?? []}
              placeholder={t('editor.explanationPlaceholder')}
              onChange={(explanation) => patch({ explanation })}
            />
          </section>
        </div>
      )}
    </BottomSheet>
  );
}

/* --------------------------------- helpers -------------------------------- */

function createOptions(count: number): AnswerOption[] {
  return Array.from({ length: count }, () => ({
    id: uid('o'),
    content: [{ id: uid('b'), type: 'text' as const, value: '' }],
    isCorrect: false,
  }));
}

function keepSingleCorrect(options: AnswerOption[]): AnswerOption[] {
  let seen = false;
  return options.map((option) => {
    if (option.isCorrect && !seen) {
      seen = true;
      return option;
    }
    return { ...option, isCorrect: false };
  });
}

function OptionRow({
  option,
  index,
  multiple,
  canRemove,
  onChange,
  onToggleCorrect,
  onRemove,
}: {
  option: AnswerOption;
  index: number;
  multiple: boolean;
  canRemove: boolean;
  onChange: (option: AnswerOption) => void;
  onToggleCorrect: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const block = option.content[0];
  const isFormula = block?.type === 'formula';

  const setValue = (value: string) => {
    const next: ContentBlock = isFormula
      ? { id: block?.id ?? uid('b'), type: 'formula', value, display: false }
      : { id: block?.id ?? uid('b'), type: 'text', value };
    onChange({ ...option, content: [next] });
  };

  const switchKind = () => {
    const value = block && 'value' in block ? block.value : '';
    onChange({
      ...option,
      content: [
        isFormula
          ? { id: uid('b'), type: 'text', value }
          : { id: uid('b'), type: 'formula', value, display: false },
      ],
    });
  };

  const value = block && 'value' in block ? block.value : '';

  return (
    <div className="rounded-card bg-surface-muted p-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCorrect}
          aria-label={t('editor.markCorrect')}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center border text-small font-medium transition-colors duration-150',
            multiple ? 'rounded-md' : 'rounded-full',
            option.isCorrect
              ? 'border-success bg-success text-on-primary'
              : 'border-border text-text-muted',
          )}
        >
          {String.fromCharCode(65 + index)}
        </button>

        {isFormula ? (
          <div className="min-w-0 flex-1">
            <FormulaInput value={value} onChange={setValue} />
          </div>
        ) : (
          <input
            value={value}
            placeholder={t('editor.optionPlaceholder')}
            onChange={(event) => setValue(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-control border border-border bg-surface-muted px-3 text-body text-text placeholder:text-text-muted/70 focus:border-primary focus:bg-surface focus:outline-none"
          />
        )}

        <IconButton
          label={isFormula ? t('editor.addText') : t('editor.addFormula')}
          onClick={switchKind}
          className="h-9 w-9 shrink-0"
        >
          {isFormula ? (
            <Type size={16} strokeWidth={1.75} />
          ) : (
            <Sigma size={16} strokeWidth={1.75} />
          )}
        </IconButton>
        <IconButton
          label={t('common.delete')}
          tone="danger"
          disabled={!canRemove}
          onClick={onRemove}
          className="h-9 w-9 shrink-0"
        >
          <Trash2 size={16} strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  );
}
