import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Sparkles, Star } from 'lucide-react';
import type { AnswerOption, Question } from '@/services/types';
import { useUiStore } from '@/store/ui';
import { toast } from '@/store/toast';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { BottomSheet } from '@/components/BottomSheet';
import { Button, IconButton } from '@/components/Button';
import { Card, CardTitle, SectionTitle } from '@/components/Card';
import { CircularProgress } from '@/components/CircularProgress';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Countdown } from '@/components/Countdown';
import { EmptyState } from '@/components/EmptyState';
import { FormulaInput } from '@/components/FormulaInput';
import { Input } from '@/components/Input';
import { Leaderboard } from '@/components/Leaderboard';
import { ListRow, ListSection, ListToggleRow } from '@/components/ListSection';
import { LiveAnswerChart } from '@/components/LiveAnswerChart';
import { MathText } from '@/components/MathText';
import { Modal } from '@/components/Modal';
import { OptionCard } from '@/components/OptionCard';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionNavigator } from '@/components/QuestionNavigator';
import { QuestionView } from '@/components/QuestionView';
import { Select } from '@/components/Select';
import { SkeletonList } from '@/components/Skeleton';
import { Stepper } from '@/components/Stepper';
import { Switch } from '@/components/Switch';
import { Tabs } from '@/components/Tabs';
import { Textarea } from '@/components/Textarea';
import { Timer, RingTimer } from '@/components/Timer';
import { ErrorState } from '@/components/StateViews';

const demoOptions: AnswerOption[] = [
  { id: 'a', content: [{ id: '1', type: 'text', value: 'Birinchi variant' }], isCorrect: true },
  {
    id: 'b',
    content: [{ id: '2', type: 'formula', value: 'x^2+1', display: false }],
    isCorrect: false,
  },
  { id: 'c', content: [{ id: '3', type: 'text', value: 'Uchinchi variant' }], isCorrect: false },
];

const demoQuestion: Question = {
  id: 'demo',
  testId: 'demo',
  order: 0,
  type: 'single',
  content: [
    { id: 'q1', type: 'text', value: 'Diskriminant $D = b^2 - 4ac$ nimani aniqlaydi?' },
    { id: 'q2', type: 'formula', value: 'x = \\frac{-b \\pm \\sqrt{D}}{2a}', display: true },
  ],
  options: demoOptions,
  acceptedAnswers: [],
  points: 2,
};

/** Dev-only showcase: every shared component, in both themes. */
export default function UiKitPage() {
  const { t } = useTranslation();
  const { themePreference, setThemePreference, resolvedTheme } = useUiStore();
  const [listToggle, setListToggle] = useState(true);
  const [tab, setTab] = useState<'one' | 'two'>('one');
  const [checked, setChecked] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formula, setFormula] = useState('\\frac{a}{b} + \\sqrt{c}');
  const [navIndex, setNavIndex] = useState(2);

  usePrimaryAction({ label: 'MainButton', onClick: () => toast.info('MainButton') });

  const soon = new Date(Date.now() + 95 * 1000).toISOString();

  return (
    <Page>
      <PageHeader
        title={t('dev.uiKit')}
        subtitle={resolvedTheme}
        onBack="auto"
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setThemePreference(themePreference === 'dark' ? 'light' : 'dark')}
          >
            {themePreference === 'dark' ? 'Light' : 'Dark'}
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        <Section title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="accent">Accent</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Star">
              <Star size={18} strokeWidth={1.75} />
            </IconButton>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="primary">Primary</Badge>
            <Badge tone="accent" icon={<Sparkles size={12} strokeWidth={2} />}>
              Accent
            </Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="danger" pulse>
              Live
            </Badge>
            <Badge tone="info">Info</Badge>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="flex flex-col gap-3">
            <Input label="Input" placeholder="Matn kiriting" />
            <Input label="Xato bilan" error="Xato matni" defaultValue="noto'g'ri" />
            <Textarea label="Textarea" placeholder="Uzun matn" />
            <Select
              label="Select"
              options={[
                { value: '1', label: 'Birinchi' },
                { value: '2', label: 'Ikkinchi' },
              ]}
            />
            <Switch checked={checked} onChange={setChecked} label="Switch" hint="Izoh matni" />
          </div>
        </Section>

        <Section title="Lists">
          <ListSection header="Grouped list" footer="A footnote, as Telegram sets its hints.">
            <ListRow
              icon={<Languages size={16} strokeWidth={1.75} />}
              title="Til"
              value="O'zbekcha"
              onClick={() => undefined}
            />
            <ListRow title="Ikonkasiz qator" subtitle="Izoh matni" value="Qiymat" />
            <ListToggleRow title="Toggle qatori" checked={listToggle} onChange={setListToggle} />
            <ListRow title="Xavfli amal" tone="danger" chevron={false} onClick={() => undefined} />
          </ListSection>
        </Section>

        <Section title="Navigation">
          <div className="flex flex-col gap-3">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: 'one', label: 'Segmented' },
                { value: 'two', label: 'Tabs' },
              ]}
            />
            <Tabs
              variant="underline"
              value={tab}
              onChange={setTab}
              items={[
                { value: 'one', label: 'Underline', count: 3 },
                { value: 'two', label: 'Ikkinchi' },
              ]}
            />
            <Stepper steps={['Tur', 'Maʼlumot', 'Savollar']} current={1} />
          </div>
        </Section>

        <Section title="Progress & time">
          <div className="flex flex-col gap-4">
            <ProgressBar value={62} />
            <ProgressBar value={28} tone="danger" size="sm" />
            <div className="flex flex-wrap items-center gap-4">
              <CircularProgress value={78} label="78%" sublabel="14 / 18" />
              <RingTimer remainingSec={8} totalSec={20} />
              <Timer deadline={soon} />
            </div>
            <Countdown target={new Date(Date.now() + 3 * 3600_000).toISOString()} />
          </div>
        </Section>

        <Section title="Overlays">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              BottomSheet
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Modal
            </Button>
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              ConfirmDialog
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Toast')}>
              Toast
            </Button>
          </div>
        </Section>

        <Section title="Content">
          <div className="flex flex-col gap-3">
            <Card>
              <CardTitle>Karta sarlavhasi</CardTitle>
              <p className="mt-1 text-body text-text-muted">
                <MathText value="Matn ichida formula: $E = mc^2$ va $\\int_0^1 x\\,dx$." />
              </p>
            </Card>
            <Card>
              <MathText value="Xato LaTeX: $\\frac{1}{$" />
            </Card>
            <QuestionView
              question={demoQuestion}
              answer={{ questionId: 'demo', optionIds: ['a'], answeredAt: '' }}
            />
            <OptionCard option={demoOptions[0] as AnswerOption} index={0} state="correct" />
            <OptionCard
              option={demoOptions[1] as AnswerOption}
              index={1}
              state="wrong"
              share={0.4}
            />
          </div>
        </Section>

        <Section title="Formula input">
          <FormulaInput value={formula} onChange={setFormula} />
        </Section>

        <Section title="Navigator">
          <QuestionNavigator
            total={12}
            current={navIndex}
            answered={Array.from({ length: 12 }, (_, i) => i % 3 !== 0)}
            flagged={Array.from({ length: 12 }, (_, i) => i === 4)}
            onSelect={setNavIndex}
          />
        </Section>

        <Section title="Live chart">
          <LiveAnswerChart
            optionIds={['a', 'b', 'c']}
            counts={{ a: 12, b: 5, c: 3 }}
            correctIds={['a']}
            reveal
          />
        </Section>

        <Section title="Leaderboard">
          <Leaderboard
            currentUserId="u5"
            rows={[1, 2, 3, 4, 5].map((rank) => ({
              rank,
              userId: `u${rank}`,
              userName: `Ishtirokchi ${rank}`,
              score: 100 - rank * 7,
              maxScore: 100,
              percent: 100 - rank * 7,
              timeSec: 300 + rank * 20,
              attemptId: `a${rank}`,
            }))}
          />
        </Section>

        <Section title="States">
          <div className="flex flex-col gap-4">
            <SkeletonList count={2} />
            <EmptyState title="Bo'sh holat" description="Hozircha hech narsa yo'q." />
            <ErrorState onRetry={() => toast.error('Retry')} />
          </div>
        </Section>

        <Section title="Avatars">
          <div className="flex items-center gap-2">
            <Avatar name="Aziz Rahimov" size={48} />
            <Avatar name="Nilufar Qodirova" size={40} />
            <Avatar name="Jasur Toshmatov" size={32} />
          </div>
        </Section>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="BottomSheet">
        <p className="text-body text-text-muted">Pastdan chiquvchi panel.</p>
      </BottomSheet>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal">
        <p className="text-body text-text-muted">Modal oynasi.</p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Tasdiqlaysizmi?"
        description="Bu shunchaki namuna."
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
      />
    </Page>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionTitle className="mb-3">{title}</SectionTitle>
      {children}
    </section>
  );
}
