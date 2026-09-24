import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useToastStore, type ToastTone } from '@/store/toast';
import { cn } from '@/lib/cn';

const TONE_STYLES: Record<ToastTone, string> = {
  info: 'border-border bg-surface text-text',
  success: 'border-success/30 bg-success-soft text-success',
  danger: 'border-danger/30 bg-danger-soft text-danger',
};

const ICONS: Record<ToastTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  danger: XCircle,
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,var(--safe-top))] z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {toasts.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <motion.button
              key={item.id}
              type="button"
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              onClick={() => dismiss(item.id)}
              className={cn(
                'pointer-events-auto flex w-full max-w-content items-center gap-2 rounded-control border px-3 py-2.5 text-left text-body',
                TONE_STYLES[item.tone],
              )}
              style={{ boxShadow: 'var(--shadow-raised)' }}
            >
              <Icon size={18} strokeWidth={1.75} className="shrink-0" />
              <span className="flex-1">{item.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
