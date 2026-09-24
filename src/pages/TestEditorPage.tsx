import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { api } from '@/services';
import type { Question, Test, TestType } from '@/services/types';
import { uid } from '@/lib/id';
import { useCurrentUser } from '@/store/session';
import { toast } from '@/store/toast';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Button } from '@/components/Button';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { Stepper } from '@/components/Stepper';
import { useTestDraft } from '@/features/test-editor/useTestDraft';
import { validateBasics, validateTest } from '@/features/test-editor/validation';
import { forgetStep, recallStep, rememberStep } from '@/features/test-editor/lastStep';
import { StepType } from '@/features/test-editor/StepType';
import { StepBasics } from '@/features/test-editor/StepBasics';
import { StepQuestions } from '@/features/test-editor/StepQuestions';
import { StepSettings } from '@/features/test-editor/StepSettings';
import { StepReview } from '@/features/test-editor/StepReview';
import { QuestionEditorSheet } from '@/features/test-editor/QuestionEditorSheet';
import { ImportSheet } from '@/features/test-editor/ImportSheet';

const STEP_KEYS = ['wizard.step1', 'wizard.step2', 'wizard.step3', 'wizard.step4', 'wizard.step5'];
const LAST_STEP = STEP_KEYS.length - 1;
/** Index of the questions step, where the import sheet lives. */
const QUESTIONS_STEP = 2;

function blankQuestion(testId: string, order: number, live: boolean): Question {
  return {
    id: uid('q'),
    testId,
    order,
    type: 'single',
    content: [{ id: uid('b'), type: 'text', value: '' }],
    options: [
      { id: uid('o'), content: [{ id: uid('b'), type: 'text', value: '' }], isCorrect: true },
      { id: uid('o'), content: [{ id: uid('b'), type: 'text', value: '' }], isCorrect: false },
    ],
    acceptedAnswers: [],
    points: 1,
    timeLimitSec: live ? 20 : undefined,
  };
}

export default function TestEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const user = useCurrentUser();

  // The home screen can send the author straight to the import sheet.
  const wantsImport = searchParams.get('import') === '1';
  const draft = useTestDraft(testId);
  const [step, setStep] = useState(() => {
    if (!testId) return 0;
    return wantsImport ? QUESTIONS_STEP : recallStep(testId, 1, LAST_STEP);
  });
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const test = draft.test;
  const issues = useMemo(
    () => (test ? validateTest(test, draft.questions) : []),
    [test, draft.questions],
  );
  const basicsErrors = useMemo(() => (test ? validateBasics(test) : {}), [test]);

  /** Every step change is remembered so the draft reopens where it was left. */
  const goToStep = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), LAST_STEP);
      setStep(clamped);
      if (test) rememberStep(test.id, clamped);
    },
    [test],
  );

  const pendingImport = useRef(wantsImport);
  useEffect(() => {
    if (!pendingImport.current || !test) return;
    pendingImport.current = false;
    setImportOpen(true);
  }, [test]);

  /* ------------------------------ step actions ----------------------------- */

  const createDraft = async (type: TestType) => {
    if (!user) return;
    setCreating(true);
    try {
      const created = await api.tests.create(
        {
          type,
          title: '',
          description: '',
          subject: '',
          settings: type === 'live' ? { durationMin: null } : {},
        },
        user.id,
      );
      // Switch to the persisted draft so autosave has something to write to.
      navigate(`/tests/${created.id}/edit${wantsImport ? '?import=1' : ''}`, { replace: true });
      setStep(1);
    } catch {
      toast.error(t('errors.unknown'));
    } finally {
      setCreating(false);
    }
  };

  const publish = async () => {
    if (!test || issues.length > 0) return;
    setPublishing(true);
    try {
      const published = await api.tests.setStatus(test.id, 'active');
      forgetStep(test.id);
      toast.success(t('wizard.published'));
      navigate(`/tests/${published.id}/manage`, { replace: true });
    } catch {
      toast.error(t('errors.unknown'));
    } finally {
      setPublishing(false);
    }
  };

  const saveQuestion = (question: Question) => {
    draft.replaceQuestions((current) =>
      current.some((item) => item.id === question.id)
        ? current.map((item) => (item.id === question.id ? question : item))
        : [...current, question],
    );
    setEditingQuestion(null);
  };

  /* ------------------------------ main button ------------------------------ */

  const isLastStep = step === LAST_STEP;

  usePrimaryAction(
    step === 0
      ? null
      : isLastStep
        ? {
            label: t('wizard.publish'),
            enabled: issues.length === 0,
            loading: publishing,
            onClick: () => void publish(),
          }
        : {
            label: t('common.next'),
            // A test without a usable name cannot move past the basics step.
            enabled: step !== 1 || basicsErrors.title === undefined,
            onClick: () => goToStep(step + 1),
          },
  );

  if (draft.loading) {
    return (
      <Page>
        <PageHeader title={t('wizard.titleEdit')} onBack="auto" />
        <LoadingState count={2} />
      </Page>
    );
  }

  if (draft.error) {
    return (
      <Page>
        <PageHeader title={t('wizard.titleEdit')} onBack="auto" />
        <ErrorState />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title={testId ? t('wizard.titleEdit') : t('wizard.titleNew')}
        subtitle={t('wizard.stepOf', { current: step + 1, total: STEP_KEYS.length })}
        onBack={() => (step === 0 ? navigate('/') : goToStep(step - 1))}
        actions={
          draft.saveState === 'saving' ? (
            <span className="flex items-center gap-1 text-small text-text-muted">
              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
              {t('wizard.saving')}
            </span>
          ) : draft.saveState === 'saved' ? (
            <span className="flex items-center gap-1 text-small text-success">
              <Check size={14} strokeWidth={2} />
              {t('common.saved')}
            </span>
          ) : null
        }
      />

      <Stepper
        steps={STEP_KEYS.map((key) => t(key))}
        current={step}
        maxReachable={test ? LAST_STEP : 0}
        onStepClick={goToStep}
      />

      <div className="mt-5">
        {step === 0 && (
          <StepType
            value={test?.type}
            disabled={creating}
            onSelect={(type) => void createDraft(type)}
          />
        )}

        {step === 1 && test && (
          <StepBasics test={test} onPatch={(patch) => draft.patchTest(patch as Partial<Test>)} />
        )}

        {step === 2 && test && (
          <StepQuestions
            questions={draft.questions}
            onReorder={(questions) => draft.replaceQuestions(() => questions)}
            onEdit={setEditingQuestion}
            onAdd={() =>
              setEditingQuestion(
                blankQuestion(test.id, draft.questions.length, test.type === 'live'),
              )
            }
            onImport={() => setImportOpen(true)}
            onDuplicate={(question) =>
              draft.replaceQuestions((current) => [
                ...current,
                {
                  ...question,
                  id: uid('q'),
                  options: question.options.map((option) => ({ ...option, id: uid('o') })),
                },
              ])
            }
            onRemove={(questionId) =>
              draft.replaceQuestions((current) =>
                current.filter((question) => question.id !== questionId),
              )
            }
          />
        )}

        {step === 3 && test && <StepSettings test={test} onPatch={draft.patchTest} />}

        {step === 4 && test && (
          <StepReview test={test} questions={draft.questions} issues={issues} />
        )}
      </div>

      {isLastStep && test && (
        <Button
          className="mt-4"
          fullWidth
          variant="secondary"
          onClick={() => navigate(`/tests/${test.id}/manage`)}
        >
          {t('wizard.saveDraft')}
        </Button>
      )}

      {test && (
        <>
          <QuestionEditorSheet
            open={editingQuestion !== null}
            question={editingQuestion}
            requireTimeLimit={test.type === 'live'}
            onClose={() => setEditingQuestion(null)}
            onSave={saveQuestion}
          />
          <ImportSheet
            open={importOpen}
            testId={test.id}
            onClose={() => setImportOpen(false)}
            onImport={(questions) =>
              draft.replaceQuestions((current) => [...current, ...questions])
            }
          />
        </>
      )}
    </Page>
  );
}
