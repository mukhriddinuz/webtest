import { useEffect, useState } from 'react';
import { getImageSrc } from '@/lib/imageStore';

/** Resolves an image id stored in IndexedDB to a renderable data URL. */
export function useImageSrc(imageId: string | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!imageId) {
      setSrc(null);
      return;
    }
    void getImageSrc(imageId).then((value) => {
      if (active) setSrc(value);
    });
    return () => {
      active = false;
    };
  }, [imageId]);

  return src;
}
