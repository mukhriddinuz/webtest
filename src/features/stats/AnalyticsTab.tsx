import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Check, ChevronDown } from 'lucide-react';
import type { Question, TestStats } from '@/services/types';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Card, CardTitle } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MathText } from '@/components/MathText';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function AnalyticsTab({ stats, questions }: { stats: TestStats; questions: Question[] }) {
  const { t } = useTranslation();

  if (stats.attempts === 0) {
    return (
      <EmptyState title={t('manage.noAnalytics')} description={t('manage.noParticipantsText')} />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label={t('manage.avgScore')} value={`${stats.averagePercent}%`} />
        <StatTile label={t('manage.avgTime')} value={formatDuration(stats.averageTimeSec)} />
        <StatTile label={t('manage.completion')} value={`${stats.completionRate}%`} />
      </div>

      <section>
        <CardTitle className="mb-2">{t('manage.distribution')}</CardTitle>
        <Card padded={false} className="p-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.scoreBuckets} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} className="stroke-border" strokeDasharray="3 3" />
              <XAxis
                dataKey="bucket"
                tickLine={false}
                axisLine={false}
                className="fill-text-muted text-small"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                className="fill-text-muted"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip unit={t('common.participants')} />} cursor={false} />
              <Bar dataKey="count" className="fill-primary" radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <section>
        <CardTitle className="mb-2">{t('manage.byQuestion')}</CardTitle>
        <Card padded={false} className="p-3">
          <ResponsiveContainer width="100%" height={Math.max(160, stats.questions.length * 26)}>
            <BarChart
              layout="vertical"
              data={stats.questions.map((question) => ({
                name: `${question.order + 1}`,
                value: question.correctRate,
              }))}
              margin={{ top: 4, right: 12, bottom: 0, left: -24 }}
            >
              <CartesianGrid horizontal={false} className="stroke-border" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                className="fill-text-muted"
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontSize: 12 }}
                className="fill-text-muted"
              />
              <Tooltip content={<ChartTooltip unit="%" />} cursor={false} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16} className="fill-primary" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <section>
        <CardTitle className="mb-2">{t('manage.hardest')}</CardTitle>
        <div className="flex flex-col gap-2">
          {stats.hardest.map((question) => (
            <div key={question.questionId} className="card flex items-center gap-3 p-3">
              <span className="tnum w-6 shrink-0 text-small text-text-muted">
                {question.order + 1}
              </span>
              <span className="line-clamp-2 min-w-0 flex-1 text-small text-text">
                <MathText value={question.preview} />
              </span>
              <span className="tnum shrink-0 text-body font-medium text-danger">
                {question.correctRate}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <CardTitle className="mb-2">{t('manage.optionDistribution')}</CardTitle>
        <div className="flex flex-col gap-2">
          {questions.map((question, index) => {
            const stat = stats.questions.find((item) => item.questionId === question.id);
            if (!stat || question.options.length === 0) return null;
            return (
              <OptionBreakdown key={question.id} index={index} question={question} stat={stat} />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OptionBreakdown({
  index,
  question,
  stat,
}: {
  index: number;
  question: Question;
  stat: TestStats['questions'][number];
}) {
  const [open, setOpen] = useState(false);
  const total = Math.max(
    1,
    Object.values(stat.optionDistribution).reduce((sum, value) => sum + value, 0),
  );

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="tnum w-6 shrink-0 text-small text-text-muted">{index + 1}</span>
        <span className="line-clamp-1 min-w-0 flex-1 text-small text-text">
          <MathText value={stat.preview} />
        </span>
        <span className="tnum shrink-0 text-small text-text-muted">{stat.correctRate}%</span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={cn('shrink-0 text-text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-2 border-t border-border p-3">
          {question.options.map((option, optionIndex) => {
            const count = stat.optionDistribution[option.id] ?? 0;
            const share = Math.round((count / total) * 100);
            return (
              <div key={option.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-small',
                    option.isCorrect
                      ? 'bg-success text-on-primary'
                      : 'bg-surface-muted text-text-muted',
                  )}
                >
                  {option.isCorrect ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    (LETTERS[optionIndex] ?? optionIndex + 1)
                  )}
                </span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      option.isCorrect ? 'bg-success' : 'bg-primary',
                    )}
                    style={{ width: `${share}%` }}
                  />
                </div>
                <span className="tnum w-14 shrink-0 text-right text-small text-text-muted">
                  {count} · {share}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-surface px-3 py-2.5">
      <p className="tnum text-[18px] font-semibold text-text">{value}</p>
      <p className="text-small leading-tight text-text-muted">{label}</p>
    </div>
  );
}

interface TooltipPayload {
  active?: boolean;
  payload?: { value?: number; payload?: { name?: string; bucket?: string } }[];
}

function ChartTooltip({ active, payload, unit }: TooltipPayload & { unit: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const label = entry?.payload?.bucket ?? entry?.payload?.name ?? '';
  return (
    <div
      className="rounded-control border border-border bg-surface px-2.5 py-1.5 text-small text-text"
      style={{ boxShadow: 'var(--shadow-raised)' }}
    >
      <span className="tnum">
        {label}: {entry?.value ?? 0} {unit}
      </span>
    </div>
  );
}
