import { cn } from '@/lib/cn';
import { hashIndex, initials } from '@/lib/format';

/** Telegram's peer colors: a top-to-bottom gradient with white initials. */
const PALETTE = [
  'from-[#FF885E] to-[#FF516A]',
  'from-[#FFCD6A] to-[#FFA85C]',
  'from-[#E0A2F3] to-[#D669ED]',
  'from-[#A0DE7E] to-[#54CB68]',
  'from-[#53EDD6] to-[#28C9B7]',
  'from-[#72D5FD] to-[#2A9EF1]',
  'from-[#82B1FF] to-[#665FFF]',
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
        !photoUrl && ['bg-gradient-to-b text-white', tone],
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
