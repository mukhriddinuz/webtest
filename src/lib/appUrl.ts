/**
 * The address the app is served from, for links that leave it. A packaged build
 * runs on its own local origin, so `VITE_PUBLIC_URL` names the real one.
 */
export function appUrl(path: string): string {
  const base = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/+$/, '');
  return `${base}${path}`;
}
