import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import type { ExamConfig, Question, QuestionResult } from '@/services/types';
import { gradeExam } from '@/lib/grading';
import { ProgressBar } from '@/components/ProgressBar';

export interface ExamScorePanelProps {
  config: ExamConfig;
  questions: readonly Question[];
  results: readonly QuestionResult[];
}

/**
 * What the exam itself would report: a ball for a DTM paper, a level for a
 * Milliy sertifikat — followed by the blocks it came from, because revision is
 * planned block by block rather than against a single overall figure.
 */
export function ExamScorePanel({ config, questions, results }: ExamScorePanelProps) {
  const { t } = useTranslation();
  const grade = gradeExam(config, questions, results);
  const reportsLevel = config.levels.length > 0;

  return (
    <section className="card mt-4 overflow-hidden">
      <div className="flex flex-col items-center gap-1 px-4 pb-4 pt-5 text-center">
        {/* The headline is whatever the exam itself would hand back: the band
            when one was reached, otherwise the plain score. */}
        {reportsLevel && grade.level ? (
          <>
            <span className="tnum text-[40px] font-semibold leading-none text-success">
              {grade.level}
            </span>
            <p className="tnum text-body text-text-muted">
              {t('exam.ballOf', { score: grade.score, max: grade.maxScore })}
            </p>
          </>
        ) : (
          <>
            <p className="tnum text-[40px] font-semibold leading-none text-text">{grade.score}</p>
            <p className="tnum text-body text-text-muted">
              {t('exam.outOf', { max: grade.maxScore })}
            </p>
            {reportsLevel && <p className="text-small text-text-muted">{t('exam.noLevel')}</p>}
          </>
        )}
      </div>

      <ul className="flex flex-col">
        {grade.sections.map((section) => (
          <li key={section.sectionId} className="border-t border-border px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-body text-text">{section.title}</span>
              <span className="tnum shrink-0 text-body font-medium text-text">
                {section.score}
                <span className="text-text-muted"> / {section.maxScore}</span>
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <ProgressBar
                className="flex-1"
                size="sm"
                value={section.correct}
                max={Math.max(1, section.total)}
                tone={section.correct / Math.max(1, section.total) >= 0.6 ? 'success' : 'primary'}
              />
              <span className="tnum shrink-0 text-small text-text-muted">
                {t('exam.correctOf', { correct: section.correct, total: section.total })}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {grade.approximate && (
        <p className="flex gap-2 border-t border-border px-4 py-3 text-small text-text-muted">
          <Info size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          {t('exam.approximateHint')}
        </p>
      )}
    </section>
  );
}
