import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from './Skeleton';

export interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Renders a QR code; the generator is loaded on demand. */
export function QrCode({ value, size = 160, className }: QrCodeProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void import('qrcode')
      .then((module) =>
        module.default.toDataURL(value, {
          width: size * 2,
          margin: 1,
          color: { dark: '#1F2433', light: '#FFFFFF' },
        }),
      )
      .then((dataUrl) => {
        if (active) setSrc(dataUrl);
      })
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!src)
    return (
      <Skeleton className={cn('rounded-card', className)} style={{ width: size, height: size }} />
    );

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn('rounded-card border border-border bg-white', className)}
    />
  );
}
