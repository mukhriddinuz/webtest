import { cn } from '@/lib/cn';
import { hashIndex, initials } from '@/lib/format';

const PALETTE = [
  'bg-primary-soft text-primary',
  'bg-accent-soft text-accent',
  'bg-success-soft text-success',
  'bg-danger-soft text-danger',
];

export interface AvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, photoUrl, size = 40, className }: AvatarProps) {
  const tone = PALETTE[hashIndex(name, PALETTE.length)];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium',
        !photoUrl && tone,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
