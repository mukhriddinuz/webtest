import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from './Avatar';

export interface PodiumEntry {
  userId: string;
  name: string;
  photoUrl?: string;
  score: number;
}

/** Top-3 podium. Order on screen is 2nd, 1st, 3rd. */
export function Podium({
  entries,
  currentUserId,
}: {
  entries: PodiumEntry[];
  currentUserId?: string;
}) {
  const [first, second, third] = entries;
  const columns = [
    { entry: second, place: 2, height: 'h-16', tone: 'bg-surface-muted text-text-muted' },
    { entry: first, place: 1, height: 'h-24', tone: 'bg-accent-soft text-accent' },
    { entry: third, place: 3, height: 'h-12', tone: 'bg-surface-muted text-text-muted' },
  ];

  return (
    <div className="flex items-end justify-center gap-3">
      {columns.map(({ entry, place, height, tone }) => (
        <div key={place} className="flex w-1/3 max-w-[120px] flex-col items-center gap-2">
          {entry ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * (3 - place), duration: 0.25 }}
              className="flex flex-col items-center gap-1"
            >
              {place === 1 && <Crown size={18} strokeWidth={1.75} className="text-accent" />}
              <Avatar
                name={entry.name}
                photoUrl={entry.photoUrl}
                size={place === 1 ? 56 : 44}
                className={cn(
                  entry.userId === currentUserId &&
                    'ring-2 ring-primary ring-offset-2 ring-offset-bg',
                )}
              />
              <span className="max-w-full truncate text-small font-medium text-text">
                {entry.name}
              </span>
              <span className="tnum text-small text-text-muted">{Math.round(entry.score)}</span>
            </motion.div>
          ) : (
            <div className="h-[84px]" />
          )}
          <div
            className={cn(
              'flex w-full items-center justify-center rounded-t-card font-semibold',
              height,
              tone,
            )}
          >
            <span className="tnum text-[20px]">{place}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
