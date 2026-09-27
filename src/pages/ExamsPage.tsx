import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import type { ExamPreset, Test } from '@/services/types';
import { useTests } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { ListRow, ListSection } from '@/components/ListSection';
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
          <ListSection
            key={preset}
            header={t(`exam.preset.${preset}`)}
            footer={t(`exam.presetHint.${preset}`)}
          >
            {group.map((test) => (
              <ExamRow key={test.id} test={test} onClick={() => navigate(`/t/${test.id}`)} />
            ))}
          </ListSection>
        );
      })}
    </Page>
  );
}

function ExamRow({ test, onClick }: { test: Test; onClick: () => void }) {
  const { t } = useTranslation();
  const config = test.settings.exam;
  const duration = test.settings.durationMin;

  const facts = [
    t('exam.questionCount', { count: test.questionCount }),
    duration !== null ? t('exam.minutes', { count: duration }) : null,
    config
      ? config.levels.length > 0
        ? t('exam.upTo', { level: config.levels[0]?.code ?? '' })
        : t('exam.outOf', { max: config.maxScore })
      : null,
  ].filter(Boolean);

  return (
    <ListRow
      icon={<GraduationCap size={16} strokeWidth={1.75} />}
      title={test.title}
      subtitle={facts.join(' · ')}
      onClick={onClick}
    />
  );
}
