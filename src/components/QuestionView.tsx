import { useTranslation } from 'react-i18next';
import type { GivenAnswer, Question } from '@/services/types';
import { correctOptionIds } from '@/lib/grading';
import { cn } from '@/lib/cn';
import { ContentBlocks } from './ContentBlocks';
import { OptionCard, type OptionState } from './OptionCard';
import { Input } from './Input';

export interface QuestionViewProps {
  question: Question;
  answer?: GivenAnswer;
  /** `review` shows the correct answers and disables input. */
  mode?: 'answer' | 'review';
  disabled?: boolean;
  onSelectOption?: (optionId: string) => void;
  onChangeValue?: (value: string) => void;
  /** optionId -> 0..1, drawn as a bar behind each option. */
  optionShares?: Record<string, number>;
  showCorrect?: boolean;
  className?: string;
}

export function QuestionView({
  question,
  answer,
  mode = 'answer',
  disabled,
  onSelectOption,
  onChangeValue,
  optionShares,
  showCorrect = false,
  className,
}: QuestionViewProps) {
  const { t } = useTranslation();
  const selected = new Set(answer?.optionIds ?? []);
  const correct = new Set(correctOptionIds(question));
  const isChoice = question.type === 'single' || question.type === 'multiple';

  const optionState = (optionId: string): OptionState => {
    const isSelected = selected.has(optionId);
    if (mode === 'answer' || !showCorrect) return isSelected ? 'selected' : 'idle';
    if (isSelected && correct.has(optionId)) return 'correct';
    if (isSelected && !correct.has(optionId)) return 'wrong';
    if (!isSelected && correct.has(optionId)) return 'missed';
    return 'idle';
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <ContentBlocks blocks={question.content} textClassName="text-question" />

      {isChoice && (
        <div className="flex flex-col gap-2">
          <p className="text-small text-text-muted">
            {question.type === 'multiple'
              ? t('attempt.selectMultipleHint')
              : t('attempt.selectHint')}
          </p>
          {question.options.map((option, index) => (
            <OptionCard
              key={option.id}
              option={option}
              index={index}
              multiple={question.type === 'multiple'}
              state={optionState(option.id)}
              disabled={disabled || mode === 'review'}
              share={optionShares?.[option.id]}
              {...(mode === 'answer' && onSelectOption
                ? { onSelect: () => onSelectOption(option.id) }
                : {})}
            />
          ))}
        </div>
      )}

      {question.type === 'text' && (
        <Input
          value={answer?.value ?? ''}
          disabled={disabled || mode === 'review'}
          placeholder={t('attempt.textPlaceholder')}
          autoComplete="off"
          onChange={(event) => onChangeValue?.(event.target.value)}
        />
      )}

      {question.type === 'numeric' && (
        <Input
          value={answer?.value ?? ''}
          disabled={disabled || mode === 'review'}
          placeholder={t('attempt.numericPlaceholder')}
          inputMode="decimal"
          autoComplete="off"
          className="tnum"
          onChange={(event) => onChangeValue?.(event.target.value)}
        />
      )}

      {mode === 'review' && showCorrect && question.type === 'text' && (
        <p className="text-small text-text-muted">
          {t('result.correctAnswer')}:{' '}
          <span className="text-success">{question.acceptedAnswers.join(', ')}</span>
        </p>
      )}

      {mode === 'review' &&
        showCorrect &&
        question.type === 'numeric' &&
        question.numericAnswer && (
          <p className="text-small text-text-muted">
            {t('result.correctAnswer')}:{' '}
            <span className="tnum text-success">
              {question.numericAnswer.value}
              {question.numericAnswer.tolerance > 0
                ? ` (±${question.numericAnswer.tolerance})`
                : ''}
            </span>
          </p>
        )}
    </div>
  );
}
