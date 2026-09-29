import { useTranslation } from 'react-i18next';
import { CircleAlert, Flag, ListChecks } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { ListRow, ListSection } from '@/components/ListSection';
import type { FinishSummary } from './finishSummary';

export interface FinishSheetProps {
  open: boolean;
  summary: FinishSummary;
  /** Answers held back by a failing connection; finishing would lose them. */
  unsent: number;
  /** Whether the candidate may go back to a question they have passed. */
  allowBack: boolean;
  /** Where the candidate is now, to tell forward gaps from ones behind them. */
  currentIndex: number;
  loading?: boolean;
  onJump: (index: number) => void;
  onClose: () => void;
  onFinish: () => void;
}

/**
 * The last look before a paper is closed for good. A bare "are you sure?"
 * asks the question without giving the means to answer it; this says how much
 * is done and where the gaps are, and takes the candidate straight to them.
 */
export function FinishSheet({
  open,
  summary,
  unsent,
  allowBack,
  currentIndex,
  loading,
  onJump,
  onClose,
  onFinish,
}: FinishSheetProps) {
  const { t } = useTranslation();

  // Where going back is not allowed, a gap behind the candidate is out of reach.
  const reachable = (index: number | null): index is number =>
    index !== null && (allowBack || index >= currentIndex);

  const jump = (index: number) => {
    onJump(index);
    onClose();
  };

  const gap = summary.unanswered > 0;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('attempt.finishTitle')}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            {t('attempt.keepGoing')}
          </Button>
          <Button
            fullWidth
            variant={gap ? 'danger' : 'primary'}
            loading={loading}
            onClick={onFinish}
          >
            {t('common.finish')}
          </Button>
        </>
      }
    >
      {/* ListSection undoes the sheet's side padding itself, so only the
          vertical padding is cancelled here. */}
      <div className="-my-4 pt-2">
        <ListSection footer={t('attempt.timeLeftHint')} className="mb-0">
          <ListRow
            icon={<ListChecks size={18} strokeWidth={1.75} />}
            iconClassName="text-success"
            title={t('attempt.summaryAnswered')}
            value={
              <span className="tnum text-text">
                {summary.answered} / {summary.total}
              </span>
            }
            chevron={false}
          />
          <ListRow
            icon={<Flag size={18} strokeWidth={1.75} />}
            iconClassName="text-accent"
            title={t('attempt.summaryFlagged')}
            value={<span className="tnum text-text">{summary.flagged}</span>}
            chevron={false}
          />
          <ListRow
            icon={<CircleAlert size={18} strokeWidth={1.75} />}
            iconClassName={gap ? 'text-danger' : 'text-text-muted'}
            title={t('attempt.summaryUnanswered')}
            value={
              <span className={gap ? 'tnum text-danger' : 'tnum text-text'}>
                {summary.unanswered}
              </span>
            }
            tone={gap ? 'danger' : 'default'}
            chevron={false}
          />
        </ListSection>

        {summary.blocks.length > 0 ? (
          // A paper of ninety is read block by block, so the gaps are too.
          <ListSection header={t('attempt.blocks')} className="mb-0 mt-3">
            {summary.blocks.map((block) => {
              const jumpable = reachable(block.firstUnansweredIndex);
              return (
                <ListRow
                  key={block.id}
                  title={block.title}
                  subtitle={
                    block.unanswered === 0
                      ? t('attempt.blockAllAnswered')
                      : t('attempt.blockUnanswered', { count: block.unanswered })
                  }
                  value={
                    <span className="tnum text-text">
                      {block.answered} / {block.total}
                    </span>
                  }
                  onClick={
                    jumpable && block.firstUnansweredIndex !== null
                      ? () => jump(block.firstUnansweredIndex as number)
                      : undefined
                  }
                />
              );
            })}
          </ListSection>
        ) : (
          reachable(summary.firstUnansweredIndex) && (
            <ListSection className="mb-0 mt-3">
              <ListRow
                title={t('attempt.goToUnanswered')}
                tone="primary"
                onClick={() => jump(summary.firstUnansweredIndex as number)}
              />
            </ListSection>
          )
        )}

        {unsent > 0 && (
          <p
            role="alert"
            className="mt-3 rounded-control bg-danger-soft px-3 py-2 text-small text-danger"
          >
            {t('attempt.unsentWarning', { count: unsent })}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
