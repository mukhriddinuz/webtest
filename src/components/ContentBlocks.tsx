import type { ContentBlock } from '@/services/types';
import { cn } from '@/lib/cn';
import { Math, MathText } from './MathText';
import { StoredImage } from './ImageZoom';

export interface ContentBlocksProps {
  blocks: ContentBlock[];
  className?: string;
  textClassName?: string;
  compact?: boolean;
}

/** Renders a question / option / explanation body. */
export function ContentBlocks({ blocks, className, textClassName, compact }: ContentBlocksProps) {
  if (blocks.length === 0) return null;

  return (
    <div className={cn('flex flex-col', compact ? 'gap-1' : 'gap-2', className)}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'text':
            return (
              <MathText
                key={block.id}
                value={block.value}
                className={cn('text-text', textClassName)}
              />
            );
          case 'formula':
            return (
              <div key={block.id} className={block.display ? 'math-scroll py-1' : undefined}>
                <Math value={block.value} display={block.display} />
              </div>
            );
          case 'image':
            return (
              <figure key={block.id} className="flex flex-col gap-1">
                <StoredImage imageId={block.imageId} alt={block.caption ?? ''} />
                {block.caption && (
                  <figcaption className="text-small text-text-muted">{block.caption}</figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
