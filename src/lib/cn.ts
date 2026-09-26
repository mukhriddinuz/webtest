import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Our font sizes are named (`text-body`, `text-card-title`, …) rather than
 * Tailwind's `text-sm` / `text-lg`. tailwind-merge cannot tell such a name
 * from a color, so without this it files `text-body` under text color and
 * drops whichever of the two comes first — silently erasing either the size
 * or the color. Registering the scale keeps both.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['page-title', 'section-title', 'card-title', 'body', 'question', 'small'] },
      ],
    },
  },
});

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
