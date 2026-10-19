import { useEffect, useRef, useState } from 'react';
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
  /**
   * Shows the image this many pixels wide and lets it be panned, instead of
   * shrinking it to fit: for a wide picture on a narrow screen, where fitting
   * makes it no bigger than it already was.
   */
  panWidth?: number;
}

export function ImageZoom({ src, alt = '', onClose, panWidth }: ImageZoomProps) {
  const scroller = useRef<HTMLDivElement>(null);

  // A wide picture opens on its middle, where the name and the result are.
  useEffect(() => {
    const element = scroller.current;
    if (panWidth && element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
  }, [panWidth, src]);

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
      ref={scroller}
      className={cn(
        'fixed inset-0 z-[70] animate-fade-in bg-black/90',
        panWidth ? 'overflow-auto p-4 pt-16' : 'flex items-center justify-center p-4',
      )}
      onClick={(event) => {
        // A wide picture is mostly the backdrop's own area: only a tap beside
        // it closes the viewer, so a drag or a tap on the picture does not.
        if (!panWidth || event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-3 top-[max(0.75rem,var(--safe-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <X size={20} strokeWidth={1.75} />
      </button>
      {panWidth ? (
        <img
          src={src}
          alt={alt}
          style={{ width: panWidth }}
          className="mx-auto max-w-none rounded-card"
        />
      ) : (
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
      )}
    </div>,
    document.body,
  );
}
