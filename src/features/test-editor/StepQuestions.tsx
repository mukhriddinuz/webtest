import { useTranslation } from 'react-i18next';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Copy, GripVertical, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import type { ExamConfig, Question } from '@/services/types';
import { sectionQuota } from '@/features/exams/presets';
import { blocksToPlainText } from '@/lib/content';
import { Badge } from '@/components/Badge';
import { Button, IconButton } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListRow, ListSection } from '@/components/ListSection';
import { MathText } from '@/components/MathText';

export interface StepQuestionsProps {
  questions: Question[];
  /** Set on an exam, which is written one block at a time. */
  exam?: ExamConfig;
  onReorder: (questions: Question[]) => void;
  onEdit: (question: Question) => void;
  onDuplicate: (question: Question) => void;
  onRemove: (questionId: string) => void;
  onAdd: (sectionId?: string) => void;
  onImport: (sectionId?: string) => void;
}

export function StepQuestions({
  questions,
  exam,
  onReorder,
  onEdit,
  onDuplicate,
  onRemove,
  onAdd,
  onImport,
}: StepQuestionsProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    // A small distance keeps taps from being swallowed by the drag sensor.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = questions.findIndex((question) => question.id === active.id);
    const to = questions.findIndex((question) => question.id === over.id);
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(questions, from, to));
  };

  if (exam) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-section-title text-text">{t('wizard.questions')}</h2>
        {exam.sections.map((section) => {
          const own = questions.filter((question) => question.sectionId === section.id);
          const quota = sectionQuota(exam.preset, section.id);
          const complete = quota !== undefined && own.length === quota;
          return (
            <ListSection
              key={section.id}
              header={section.title}
              footer={section.subject || undefined}
            >
              <ListRow
                title={t('wizard.questions')}
                value={
                  quota === undefined
                    ? t('exam.blockCount', { count: own.length })
                    : t('exam.blockProgress', { count: own.length, total: quota })
                }
                trailing={
                  complete ? (
                    <span className="flex items-center gap-2 text-body text-text-muted">
                      <span className="tnum">
                        {t('exam.blockProgress', { count: own.length, total: quota })}
                      </span>
                      <Check size={18} strokeWidth={2.25} className="text-success" />
                    </span>
                  ) : undefined
                }
                chevron={false}
              />
              {own.map((question, index) => (
                <ListRow
                  key={question.id}
                  title={`${index + 1}. ${blocksToPlainText(question.content).trim() || t('wizard.emptyQuestion')}`}
                  subtitle={t(`questionType.${question.type}`)}
                  onClick={() => onEdit(question)}
                />
              ))}
              <ListRow
                icon={<Plus size={16} strokeWidth={2} />}
                iconClassName="text-primary"
                title={t('exam.addToBlock')}
                tone="primary"
                chevron={false}
                onClick={() => onAdd(section.id)}
              />
              <ListRow
                icon={<Upload size={16} strokeWidth={1.75} />}
                iconClassName="text-primary"
                title={t('exam.importToBlock')}
                tone="primary"
                chevron={false}
                onClick={() => onImport(section.id)}
              />
            </ListSection>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-section-title text-text">{t('wizard.questions')}</h2>
        <span className="tnum text-small text-text-muted">{questions.length}</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" icon={<Plus size={15} strokeWidth={1.75} />} onClick={() => onAdd()}>
          {t('wizard.addQuestion')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Upload size={15} strokeWidth={1.75} />}
          onClick={() => onImport()}
        >
          {t('wizard.importQuestions')}
        </Button>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          title={t('wizard.noQuestions')}
          description={t('wizard.noQuestionsText')}
          actionLabel={t('wizard.addQuestion')}
          onAction={() => onAdd()}
        />
      ) : (
        <>
          <p className="text-small text-text-muted">{t('wizard.dragHint')}</p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((question) => question.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {questions.map((question, index) => (
                  <SortableQuestionRow
                    key={question.id}
                    question={question}
                    index={index}
                    onEdit={() => onEdit(question)}
                    onDuplicate={() => onDuplicate(question)}
                    onRemove={() => onRemove(question.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}

function SortableQuestionRow({
  question,
  index,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  question: Question;
  index: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const preview = blocksToPlainText(question.content);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card flex items-start gap-2 p-3 ${isDragging ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        aria-label={t('wizard.dragHint')}
        className="mt-0.5 cursor-grab touch-none text-text-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} strokeWidth={1.75} />
      </button>

      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="tnum text-small text-text-muted">{index + 1}.</span>
          <Badge tone="neutral">{t(`questionType.${question.type}Short`)}</Badge>
          <span className="tnum text-small text-text-muted">
            {question.points} {t('common.pointsShort')}
          </span>
        </span>
        <span className="line-clamp-2 block text-body text-text">
          {preview ? <MathText value={preview} /> : t('wizard.noQuestions')}
        </span>
      </button>

      <div className="flex shrink-0 flex-col">
        <IconButton label={t('common.edit')} onClick={onEdit} className="h-9 w-9">
          <Pencil size={15} strokeWidth={1.75} />
        </IconButton>
        <IconButton label={t('common.duplicate')} onClick={onDuplicate} className="h-9 w-9">
          <Copy size={15} strokeWidth={1.75} />
        </IconButton>
        <IconButton label={t('common.delete')} tone="danger" onClick={onRemove} className="h-9 w-9">
          <Trash2 size={15} strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  );
}
