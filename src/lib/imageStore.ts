import { del, get, keys, set } from 'idb-keyval';
import { uid } from './id';

/**
 * Images live in IndexedDB (data URLs), not in the JSON "database", so the
 * localStorage quota is never hit. `getImageSrc` caches lookups in memory.
 */
const PREFIX = 'img:';
const cache = new Map<string, string>();

export async function putImage(dataUrl: string, id = uid('img')): Promise<string> {
  await set(PREFIX + id, dataUrl);
  cache.set(id, dataUrl);
  return id;
}

export async function getImageSrc(id: string): Promise<string | null> {
  const cached = cache.get(id);
  if (cached) return cached;
  const value = await get<string>(PREFIX + id);
  if (typeof value === 'string') {
    cache.set(id, value);
    return value;
  }
  return null;
}

export async function deleteImage(id: string): Promise<void> {
  cache.delete(id);
  await del(PREFIX + id);
}

export async function clearImages(): Promise<void> {
  cache.clear();
  const all = await keys();
  await Promise.all(
    all
      .filter((key): key is string => typeof key === 'string' && key.startsWith(PREFIX))
      .map((key) => del(key)),
  );
}

/**
 * Downscales and re-encodes a picked file in the browser.
 * Max edge 1600px, WebP when supported.
 */
export async function compressImage(file: File, maxEdge = 1600): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(image, 0, 0, width, height);
    const webp = canvas.toDataURL('image/webp', 0.85);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image could not be decoded'));
    image.src = src;
  });
}

/** SVG markup -> data URL, used by seed illustrations. */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}
