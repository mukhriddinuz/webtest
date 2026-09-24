import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, ImagePlus, Sigma, Trash2, Type } from 'lucide-react';
import type { ContentBlock } from '@/services/types';
import { uid } from '@/lib/id';
import { Button, IconButton } from '@/components/Button';
import { FormulaInput } from '@/components/FormulaInput';
import { ImageUploader } from '@/components/ImageUploader';
import { Input } from '@/components/Input';

export interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  placeholder?: string;
  /** Hides the image button where pictures make no sense (e.g. explanations). */
  allowImages?: boolean;
}

/** Add, reorder and remove the text / formula / image blocks of a question. */
export function ContentBlockEditor({
  blocks,
  onChange,
  placeholder,
  allowImages = true,
}: ContentBlockEditorProps) {
  const { t } = useTranslation();

  const update = (id: string, next: ContentBlock) =>
    onChange(blocks.map((block) => (block.id === id ? next : block)));

  const remove = (id: string) => onChange(blocks.filter((block) => block.id !== id));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    onChange(next);
  };

  const add = (type: ContentBlock['type']) => {
    const block: ContentBlock =
      type === 'text'
        ? { id: uid('b'), type: 'text', value: '' }
        : type === 'formula'
          ? { id: uid('b'), type: 'formula', value: '', display: false }
          : { id: uid('b'), type: 'image', imageId: '' };
    onChange([...blocks, block]);
  };

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => (
        <div key={block.id} className="rounded-card border border-border bg-surface p-3">
          <div className="mb-2 flex items-center gap-1">
            <span className="text-small text-text-muted">
              {block.type === 'text'
                ? t('editor.addText')
                : block.type === 'formula'
                  ? t('editor.addFormula')
                  : t('editor.addImage')}
            </span>
            <div className="ml-auto flex items-center">
              <IconButton
                label={t('common.previous')}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="h-9 w-9"
              >
                <ArrowUp size={16} strokeWidth={1.75} />
              </IconButton>
              <IconButton
                label={t('common.next')}
                disabled={index === blocks.length - 1}
                onClick={() => move(index, 1)}
                className="h-9 w-9"
              >
                <ArrowDown size={16} strokeWidth={1.75} />
              </IconButton>
              <IconButton
                label={t('common.delete')}
                tone="danger"
                onClick={() => remove(block.id)}
                className="h-9 w-9"
              >
                <Trash2 size={16} strokeWidth={1.75} />
              </IconButton>
            </div>
          </div>

          {block.type === 'text' && (
            <textarea
              value={block.value}
              rows={3}
              placeholder={placeholder ?? t('editor.textPlaceholder')}
              onChange={(event) => update(block.id, { ...block, value: event.target.value })}
              className="w-full resize-y rounded-control border border-border bg-surface-muted px-3 py-2.5 text-body text-text placeholder:text-text-muted/70 focus:border-primary focus:bg-surface focus:outline-none"
            />
          )}

          {block.type === 'formula' && (
            <FormulaInput
              value={block.value}
              display={block.display}
              onChange={(value) => update(block.id, { ...block, value })}
              onDisplayChange={(display) => update(block.id, { ...block, display })}
            />
          )}

          {block.type === 'image' && (
            <div className="flex flex-col gap-2">
              <ImageUploader
                imageId={block.imageId || undefined}
                onChange={(imageId) => update(block.id, { ...block, imageId: imageId ?? '' })}
              />
              <Input
                value={block.caption ?? ''}
                placeholder={t('editor.caption')}
                onChange={(event) => update(block.id, { ...block, caption: event.target.value })}
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={<Type size={15} strokeWidth={1.75} />}
          onClick={() => add('text')}
        >
          {t('editor.addText')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Sigma size={15} strokeWidth={1.75} />}
          onClick={() => add('formula')}
        >
          {t('editor.addFormula')}
        </Button>
        {allowImages && (
          <Button
            size="sm"
            variant="secondary"
            icon={<ImagePlus size={15} strokeWidth={1.75} />}
            onClick={() => add('image')}
          >
            {t('editor.addImage')}
          </Button>
        )}
      </div>
    </div>
  );
}
