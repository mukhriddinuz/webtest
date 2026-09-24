import { useTranslation } from 'react-i18next';
import { FileText, Radio, Trophy, Users } from 'lucide-react';
import type { TestStatus, TestType } from '@/services/types';
import { cn } from '@/lib/cn';
import { Badge, type BadgeTone } from './Badge';

export const TYPE_ICON = {
  standard: FileText,
  contest: Trophy,
  limited: Users,
  live: Radio,
} as const;

/** Only the glyph carries the type color; the chip itself stays neutral. */
const TYPE_ICON_COLOR: Record<TestType, string> = {
  standard: 'text-primary',
  contest: 'text-accent',
  limited: 'text-info',
  live: 'text-danger',
};

export function TestTypeBadge({ type }: { type: TestType }) {
  const { t } = useTranslation();
  const Icon = TYPE_ICON[type];
  return (
    <Badge
      tone="neutral"
      icon={<Icon size={12} strokeWidth={2} className={TYPE_ICON_COLOR[type]} />}
    >
      {t(`testType.${type}`)}
    </Badge>
  );
}

const STATUS_TONE: Record<TestStatus, BadgeTone> = {
  draft: 'neutral',
  scheduled: 'info',
  active: 'success',
  finished: 'neutral',
  archived: 'neutral',
};

export function TestStatusBadge({ status }: { status: TestStatus }) {
  const { t } = useTranslation();
  return (
    <Badge tone={STATUS_TONE[status]} className={cn(status === 'archived' && 'italic')}>
      {t(`status.${status}`)}
    </Badge>
  );
}

/**
 * Reserved for tests whose live session is really running — a live *type* on
 * its own says nothing about whether anyone is in the room right now.
 */
export function LiveOnAirBadge() {
  const { t } = useTranslation();
  return (
    <Badge tone="danger" pulse>
      {t('testCard.onAir')}
    </Badge>
  );
}
