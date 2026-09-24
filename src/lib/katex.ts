export type KatexModule = {
  renderToString(tex: string, options?: Record<string, unknown>): string;
};

let loader: Promise<KatexModule> | null = null;

/**
 * KaTeX (plus its stylesheet) is pulled in only when a formula actually needs
 * rendering, keeping it out of the initial bundle.
 */
export function loadKatex(): Promise<KatexModule> {
  if (!loader) {
    loader = Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(
      ([module]) => (module.default ?? module) as unknown as KatexModule,
    );
  }
  return loader;
}

/** Splits text into literal and math segments: `a $x^2$ b` and `$$...$$`. */
export interface MathSegment {
  type: 'text' | 'math';
  value: string;
  display: boolean;
}

export function splitMath(input: string): MathSegment[] {
  const segments: MathSegment[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match = pattern.exec(input);

  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: input.slice(lastIndex, match.index), display: false });
    }
    const display = match[1] !== undefined;
    segments.push({ type: 'math', value: (match[1] ?? match[2] ?? '').trim(), display });
    lastIndex = match.index + match[0].length;
    match = pattern.exec(input);
  }

  if (lastIndex < input.length) {
    segments.push({ type: 'text', value: input.slice(lastIndex), display: false });
  }
  return segments;
}

/** Quick check used by editors to warn before saving. */
export async function validateLatex(source: string): Promise<string | null> {
  const katex = await loadKatex();
  try {
    katex.renderToString(source, { throwOnError: true, displayMode: false });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid LaTeX';
  }
}
