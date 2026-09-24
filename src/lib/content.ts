import type { ContentBlock } from '@/services/types';

/** One-line preview used in lists, navigators, analytics and exports. */
export function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'text') return block.value;
      if (block.type === 'formula') return `$${block.value}$`;
      return block.caption ?? '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
