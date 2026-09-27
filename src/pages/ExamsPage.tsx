import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, FileQuestion, GraduationCap } from 'lucide-react';
import type { ExamPreset, Test } from '@/services/types';
import { useTests } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { SectionHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/StateViews';

/** Presets in the order they are offered; a preset with no variant is hidden. */
const PRESETS: ExamPreset[] = ['dtm', 'milliy'];

export default function ExamsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const exams = useTests({ type: 'exam', status: 'active' });

  usePrimaryAction(null);

  const variants = exams.data ?? [];

  return (
    <Page>
      <PageHeader title={t('exam.title')} subtitle={t('exam.subtitle')} onBack="auto" />

      {exams.isPending && <LoadingState count={2} />}

      {!exams.isPending && variants.length === 0 && <EmptyState title={t('exam.empty')} />}

      {PRESETS.map((preset) => {
        const group = variants.filter((test) => test.settings.exam?.preset === preset);
        if (group.length === 0) return null;
        return (
          <section key={preset} className="mb-5">
            <SectionHeader className="px-1">{t(`exam.preset.${preset}`)}</SectionHeader>
            <p className="mb-2 px-1 text-small text-text-muted">{t(`exam.presetHint.${preset}`)}</p>
            <div className="flex flex-col gap-2">
              {group.map((test) => (
                <ExamCard key={test.id} test={test} onClick={() => navigate(`/t/${test.id}`)} />
              ))}
            </div>
          </section>
        );
      })}
    </Page>
  );
}

function ExamCard({ test, onClick }: { test: Test; onClick: () => void }) {
  const { t } = useTranslation();
  const config = test.settings.exam;
  const duration = test.settings.durationMin;

  return (
    <button
      type="button"
      onClick={onClick}
      className="card flex w-full items-center gap-3 p-3 text-left transition-colors duration-150 active:bg-surface-muted"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
        <GraduationCap size={22} strokeWidth={1.75} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-card-title text-text">{test.title}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text-muted">
          <span className="inline-flex items-center gap-1">
            <FileQuestion size={13} strokeWidth={1.75} />
            <span className="tnum">{test.questionCount}</span>
          </span>
          {duration !== null && (
            <span className="inline-flex items-center gap-1">
              <Clock size={13} strokeWidth={1.75} />
              <span className="tnum">{t('exam.minutes', { count: duration })}</span>
            </span>
          )}
          {config && (
            <span className="tnum">
              {config.levels.length > 0
                ? t('exam.upTo', { level: config.levels[0]?.code ?? '' })
                : t('exam.outOf', { max: config.maxScore })}
            </span>
          )}
        </span>
      </span>

      <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-text-muted" />
    </button>
  );
}
