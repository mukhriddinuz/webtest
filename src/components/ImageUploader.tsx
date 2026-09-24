import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { compressImage, deleteImage, putImage } from '@/lib/imageStore';
import { useImageSrc } from '@/hooks/useImageSrc';
import { toast } from '@/store/toast';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

export interface ImageUploaderProps {
  imageId?: string;
  onChange: (imageId: string | undefined) => void;
  className?: string;
  /** Square thumbnail used for test covers. */
  aspect?: 'wide' | 'square';
}

/** Picks a file, downscales it in the browser and stores it in IndexedDB. */
export function ImageUploader({
  imageId,
  onChange,
  className,
  aspect = 'wide',
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const src = useImageSrc(imageId);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      const id = await putImage(dataUrl);
      onChange(id);
    } catch {
      toast.error(t('import.errInvalidFile'));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (imageId) await deleteImage(imageId);
    onChange(undefined);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {src ? (
        <div className="relative">
          <img
            src={src}
            alt=""
            className={cn(
              'w-full rounded-card border border-border object-cover',
              aspect === 'square' ? 'aspect-square max-w-[140px]' : 'max-h-56',
            )}
          />
          <IconButton
            label={t('common.remove')}
            tone="danger"
            onClick={() => void remove()}
            className="absolute right-1 top-1 bg-surface/90 backdrop-blur"
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </IconButton>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex min-h-[96px] w-full flex-col items-center justify-center gap-2 rounded-card',
            'border border-dashed border-border bg-surface-muted text-text-muted',
            'transition-colors duration-150 hover:border-primary/50 hover:text-text',
            aspect === 'square' && 'max-w-[140px] aspect-square',
          )}
        >
          {busy ? (
            <Loader2 size={20} strokeWidth={1.75} className="animate-spin" />
          ) : (
            <ImagePlus size={20} strokeWidth={1.75} />
          )}
          <span className="text-small">{t('editor.uploadImage')}</span>
        </button>
      )}
      <p className="text-small text-text-muted">{t('editor.imageHint')}</p>
    </div>
  );
}
