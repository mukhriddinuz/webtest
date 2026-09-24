import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { Math } from './MathText';

/** Quick-insert palette. `cursor` marks where the caret lands after insert. */
const SYMBOLS: { label: string; snippet: string; cursor?: number }[] = [
  { label: 'x²', snippet: '^{2}' },
  { label: 'xₙ', snippet: '_{n}' },
  { label: 'a/b', snippet: '\\frac{}{}', cursor: 7 },
  { label: '√', snippet: '\\sqrt{}', cursor: 6 },
  { label: '∑', snippet: '\\sum_{i=1}^{n}' },
  { label: '∫', snippet: '\\int_{a}^{b}' },
  { label: 'π', snippet: '\\pi ' },
  { label: 'α', snippet: '\\alpha ' },
  { label: 'β', snippet: '\\beta ' },
  { label: 'γ', snippet: '\\gamma ' },
  { label: 'θ', snippet: '\\theta ' },
  { label: '≤', snippet: '\\leq ' },
  { label: '≥', snippet: '\\geq ' },
  { label: '≠', snippet: '\\neq ' },
  { label: '±', snippet: '\\pm ' },
  { label: '∞', snippet: '\\infty ' },
  { label: '→', snippet: '\\to ' },
  { label: '[ ]', snippet: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
];

export interface FormulaInputProps {
  value: string;
  onChange: (value: string) => void;
  display?: boolean;
  onDisplayChange?: (display: boolean) => void;
  autoFocus?: boolean;
}

/** LaTeX editor with a symbol palette and a live preview underneath. */
export function FormulaInput({
  value,
  onChange,
  display = false,
  onDisplayChange,
  autoFocus,
}: FormulaInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const insert = (snippet: string, cursor?: number) => {
    const field = inputRef.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    // Restore the caret after React re-renders the textarea.
    window.requestAnimationFrame(() => {
      if (!field) return;
      const offset = start + (cursor ?? snippet.length);
      field.focus();
      field.setSelectionRange(offset, offset);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {SYMBOLS.map((symbol) => (
          <button
            key={symbol.label}
            type="button"
            onClick={() => insert(symbol.snippet, symbol.cursor)}
            className="h-9 min-w-[36px] rounded-control border border-border bg-surface px-2 text-body text-text transition-colors duration-150 hover:border-primary/50 hover:bg-primary-soft"
          >
            {symbol.label}
          </button>
        ))}
      </div>

      <textarea
        ref={inputRef}
        value={value}
        autoFocus={autoFocus}
        rows={2}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('editor.formulaPlaceholder')}
        className="w-full resize-y rounded-control border border-border bg-surface-muted px-3 py-2.5 font-mono text-body text-text placeholder:text-text-muted/70 focus:border-primary focus:bg-surface focus:outline-none"
      />

      {onDisplayChange && (
        <div className="flex gap-1 rounded-control bg-surface-muted p-1">
          {[
            { value: false, label: t('editor.formulaInline') },
            { value: true, label: t('editor.formulaDisplay') },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onDisplayChange(option.value)}
              className={cn(
                'flex-1 rounded-[9px] px-3 py-1.5 text-small transition-colors duration-150',
                display === option.value
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-control border border-dashed border-border bg-surface px-3 py-2.5">
        <p className="mb-1 text-small text-text-muted">{t('editor.formulaPreview')}</p>
        {value.trim() === '' ? (
          <p className="text-small text-text-muted/70">—</p>
        ) : (
          <Math value={value} display={display} />
        )}
      </div>
    </div>
  );
}
