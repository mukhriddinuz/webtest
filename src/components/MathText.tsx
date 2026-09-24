import { useEffect, useMemo, useState } from 'react';
import { loadKatex, splitMath } from '@/lib/katex';
import { cn } from '@/lib/cn';

type KatexModule = Awaited<ReturnType<typeof loadKatex>>;

/** Shared across every MathText instance so KaTeX loads exactly once. */
function useKatex(): KatexModule | null {
  const [katex, setKatex] = useState<KatexModule | null>(null);
  useEffect(() => {
    let active = true;
    void loadKatex().then((module) => {
      if (active) setKatex(module);
    });
    return () => {
      active = false;
    };
  }, []);
  return katex;
}

export interface MathProps {
  /** Raw LaTeX, without delimiters. */
  value: string;
  display?: boolean;
  className?: string;
}

/** Renders a single formula; invalid LaTeX falls back to the raw source. */
export function Math({ value, display = false, className }: MathProps) {
  const katex = useKatex();

  const rendered = useMemo(() => {
    if (!katex) return null;
    try {
      return {
        html: katex.renderToString(value, {
          displayMode: display,
          throwOnError: true,
          strict: false,
          output: 'html',
        }),
        error: false,
      };
    } catch {
      return { html: '', error: true };
    }
  }, [katex, value, display]);

  if (!rendered) {
    return <span className={cn('tnum opacity-60', className)}>{value}</span>;
  }

  if (rendered.error) {
    return (
      <span
        className={cn(
          'inline-block rounded border border-danger bg-danger-soft px-1.5 py-0.5 font-mono text-small text-danger',
          className,
        )}
        title="LaTeX"
      >
        {value}
      </span>
    );
  }

  return (
    <span
      className={cn('math-scroll', display ? 'block py-1' : 'inline-block align-middle', className)}
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}

export interface MathTextProps {
  /** Text that may contain `$inline$` and `$$display$$` formulas. */
  value: string;
  className?: string;
}

/** Plain text with embedded formulas, preserving line breaks. */
export function MathText({ value, className }: MathTextProps) {
  const segments = useMemo(() => splitMath(value), [value]);

  return (
    <span className={cn('whitespace-pre-wrap break-words', className)}>
      {segments.map((segment, index) =>
        segment.type === 'math' ? (
          <Math key={index} value={segment.value} display={segment.display} />
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </span>
  );
}
