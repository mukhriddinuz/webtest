import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useImageSrc } from '@/hooks/useImageSrc';
import { Skeleton } from './Skeleton';

export interface StoredImageProps {
  imageId: string;
  alt?: string;
  className?: string;
  zoomable?: boolean;
}

/** Image persisted in IndexedDB; tapping it opens a full screen viewer. */
export function StoredImage({ imageId, alt = '', className, zoomable = true }: StoredImageProps) {
  const src = useImageSrc(imageId);
  const [zoomed, setZoomed] = useState(false);

  if (!src) return <Skeleton className={cn('h-40 w-full rounded-card', className)} />;

  return (
    <>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onClick={() => zoomable && setZoomed(true)}
        className={cn(
          'max-h-72 w-full rounded-card bg-surface object-contain',
          zoomable && 'cursor-zoom-in',
          className,
        )}
      />
      {zoomed && <ImageZoom src={src} alt={alt} onClose={() => setZoomed(false)} />}
    </>
  );
}

export interface ImageZoomProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageZoom({ src, alt = '', onClose }: ImageZoomProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex animate-fade-in items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-[max(0.75rem,var(--safe-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <X size={20} strokeWidth={1.75} />
      </button>
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
    </div>,
    document.body,
  );
}
