import { useTranslation } from 'react-i18next';
import { Radio, Swords, Timer, Users } from 'lucide-react';
import type { TestType } from '@/services/types';
import { cn } from '@/lib/cn';

const TYPES: { value: TestType; icon: typeof Timer }[] = [
  { value: 'standard', icon: Timer },
  { value: 'contest', icon: Swords },
  { value: 'limited', icon: Users },
  { value: 'live', icon: Radio },
];

const TONE: Record<TestType, string> = {
  standard: 'text-primary bg-primary-soft',
  contest: 'text-accent bg-accent-soft',
  limited: 'text-info bg-primary-soft',
  live: 'text-danger bg-danger-soft',
};

export function StepType({
  value,
  onSelect,
  disabled,
}: {
  value?: TestType;
  onSelect: (type: TestType) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-section-title text-text">{t('wizard.chooseType')}</h2>
      {TYPES.map(({ value: type, icon: Icon }) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(type)}
          className={cn(
            'flex items-center gap-3 rounded-card border p-4 text-left transition-colors duration-150',
            value === type ? 'border-primary bg-primary-soft' : 'border-transparent bg-surface',
            disabled ? 'cursor-not-allowed opacity-60' : 'active:bg-surface-muted',
          )}
        >
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]',
              TONE[type],
            )}
          >
            <Icon size={20} strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block text-card-title text-text">{t(`testType.${type}`)}</span>
            <span className="block text-small text-text-muted">{t(`testType.${type}Desc`)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
