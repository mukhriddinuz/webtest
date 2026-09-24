import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import type { AnswerOption } from '@/services/types';
import { cn } from '@/lib/cn';
import { ContentBlocks } from './ContentBlocks';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed';

export interface OptionCardProps {
  option: AnswerOption;
  index: number;
  state: OptionState;
  multiple?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  /** Live / analytics: share of participants who picked this option. */
  share?: number;
  trailing?: ReactNode;
}

const STATE_STYLES: Record<OptionState, string> = {
  idle: 'border-border bg-surface hover:border-primary/40',
  selected: 'border-primary bg-primary-soft',
  correct: 'border-success bg-success-soft',
  wrong: 'border-danger bg-danger-soft',
  missed: 'border-success/50 bg-surface',
};

const MARKER_STYLES: Record<OptionState, string> = {
  idle: 'border-border text-text-muted',
  selected: 'border-primary bg-primary text-on-primary',
  correct: 'border-success bg-success text-on-primary',
  wrong: 'border-danger bg-danger text-on-primary',
  missed: 'border-success text-success',
};

export function OptionCard({
  option,
  index,
  state,
  multiple,
  disabled,
  onSelect,
  share,
  trailing,
}: OptionCardProps) {
  const Wrapper = onSelect ? 'button' : 'div';

  return (
    <Wrapper
      {...(onSelect ? { type: 'button' as const, onClick: onSelect, disabled } : {})}
      className={cn(
        'relative flex w-full min-h-[52px] items-center gap-3 overflow-hidden rounded-card border p-3 text-left',
        'transition-colors duration-150',
        STATE_STYLES[state],
        disabled && !onSelect ? '' : disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      {typeof share === 'number' && (
        <span
          className="absolute inset-y-0 left-0 bg-primary/10 transition-[width] duration-500"
          style={{ width: `${Math.round(share * 100)}%` }}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center border text-small font-medium',
          multiple ? 'rounded-md' : 'rounded-full',
          MARKER_STYLES[state],
        )}
      >
        {state === 'correct' || state === 'missed' ? (
          <Check size={15} strokeWidth={2.25} />
        ) : state === 'wrong' ? (
          <X size={15} strokeWidth={2.25} />
        ) : (
          (LETTERS[index] ?? index + 1)
        )}
      </span>
      <span className="relative z-10 min-w-0 flex-1">
        <ContentBlocks blocks={option.content} compact textClassName="text-body" />
      </span>
      {trailing && <span className="relative z-10 shrink-0">{trailing}</span>}
    </Wrapper>
  );
}
