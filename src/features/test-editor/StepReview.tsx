import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Question, Test } from '@/services/types';
import { Card } from '@/components/Card';
import { TestTypeBadge } from '@/components/TestTypeBadge';
import type { ValidationIssue } from './validation';

export function StepReview({
  test,
  questions,
  issues,
}: {
  test: Test;
  questions: Question[];
  issues: ValidationIssue[];
}) {
  const { t } = useTranslation();
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-section-title text-text">{t('wizard.review')}</h2>

      <Card>
        <div className="mb-2">
          <TestTypeBadge type={test.type} />
        </div>
        <p className="text-card-title text-text">{test.title || t('wizard.name')}</p>
        {test.description && <p className="mt-1 text-small text-text-muted">{test.description}</p>}
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <SummaryCell label={t('wizard.summaryQuestions')} value={questions.length} />
          <SummaryCell label={t('wizard.summaryPoints')} value={totalPoints} />
          <SummaryCell
            label={t('wizard.summaryDuration')}
            value={test.settings.durationMin ?? t('common.unlimited')}
          />
        </dl>
      </Card>

      {issues.length === 0 ? (
        <div className="flex items-center gap-2 rounded-card bg-success-soft px-3 py-3 text-body text-success">
          <CheckCircle2 size={18} strokeWidth={1.75} />
          {t('wizard.validOk')}
        </div>
      ) : (
        <div className="rounded-card bg-danger-soft p-3">
          <p className="mb-2 flex items-center gap-2 text-body font-medium text-danger">
            <AlertTriangle size={18} strokeWidth={1.75} />
            {t('wizard.validationTitle')}
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-small text-danger">
            {issues.map((issue, index) => (
              <li key={index}>{t(issue.key, issue.params)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-control bg-surface-muted py-2">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="tnum text-[18px] font-semibold text-text">{value}</dd>
    </div>
  );
}
