import { useTranslation } from 'react-i18next';
import type { ExamPreset, Test } from '@/services/types';
import { buildExamConfig, EXAM_PRESETS } from '@/features/exams/presets';
import { Input } from '@/components/Input';
import { ListRow, ListSection } from '@/components/ListSection';

export interface StepExamSetupProps {
  test: Test;
  onPatch: (patch: Partial<Test>) => void;
}

const PRESETS: ExamPreset[] = ['dtm', 'milliy'];

/**
 * The only part of an exam the author decides: which paper it imitates and
 * which subjects its blocks cover. Everything that makes the score comparable
 * — coefficients, question counts, level bands — comes from the preset and is
 * shown read-only, so nobody can publish a paper that scores unlike the real
 * one while claiming to be it.
 */
export function StepExamSetup({ test, onPatch }: StepExamSetupProps) {
  const { t } = useTranslation();
  const config = test.settings.exam;

  const applyPreset = (preset: ExamPreset) => {
    const subjects: Record<string, string> = {};
    // Keep whatever the author already typed when switching preset.
    config?.sections.forEach((section) => {
      subjects[section.id] = section.subject;
    });
    onPatch({
      settings: {
        ...test.settings,
        durationMin: EXAM_PRESETS[preset].durationMin,
        // An exam is read block by block, so nothing may be shuffled.
        shuffleQuestions: false,
        shuffleOptions: false,
        exam: buildExamConfig(preset, subjects, t),
      },
    });
  };

  const setSubject = (sectionId: string, subject: string) => {
    if (!config) return;
    onPatch({
      settings: {
        ...test.settings,
        exam: {
          ...config,
          sections: config.sections.map((section) =>
            section.id === sectionId ? { ...section, subject } : section,
          ),
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-section-title text-text">{t('exam.setup')}</h2>

      <ListSection footer={t('exam.setupHint')} className="mt-3">
        {PRESETS.map((preset) => (
          <ListRow
            key={preset}
            title={t(`exam.preset.${preset}`)}
            subtitle={t(`exam.presetHint.${preset}`)}
            trailing={
              <span
                className={
                  config?.preset === preset
                    ? 'text-body font-medium text-primary'
                    : 'text-body text-text-muted'
                }
              >
                {config?.preset === preset ? '✓' : ''}
              </span>
            }
            onClick={() => applyPreset(preset)}
            chevron={false}
          />
        ))}
      </ListSection>

      {config && (
        <>
          {/* Fixed by the preset; shown so the author knows what they are in for. */}
          <ListSection header={t('exam.sections')} footer={t('exam.sectionsHint')}>
            {config.sections.map((section) => (
              <ListRow
                key={section.id}
                title={section.title}
                subtitle={section.subject || '—'}
                value={t('exam.sectionPoints', { points: section.pointsPerQuestion })}
                chevron={false}
              />
            ))}
          </ListSection>

          <div className="flex flex-col gap-3">
            {config.sections
              .filter(
                (section) =>
                  !EXAM_PRESETS[config.preset].sections.find(
                    (template) => template.id === section.id,
                  )?.fixedSubjectKey,
              )
              .map((section) => (
                <Input
                  key={section.id}
                  label={t('exam.subjectOf', { title: section.title })}
                  placeholder={t('exam.subjectPlaceholder')}
                  value={section.subject}
                  onChange={(event) => setSubject(section.id, event.target.value)}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
