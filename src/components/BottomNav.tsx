import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { House, LibraryBig, Plus, Trophy, User } from 'lucide-react';
import { useHaptics } from '@/hooks/usePrimaryAction';
import { cn } from '@/lib/cn';

const NAV_HEIGHT = 64;

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof House;
}

/** Two items on each side of the central create button. */
const LEFT_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: House },
  { to: '/my-tests', labelKey: 'nav.myTests', icon: LibraryBig },
];

const RIGHT_ITEMS: NavItem[] = [
  { to: '/results', labelKey: 'nav.results', icon: Trophy },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
];

/**
 * Primary navigation. It publishes its height as `--nav-height` so pages can
 * reserve room for it; the height is 0 whenever the bar is not rendered.
 */
export function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--nav-height', `${NAV_HEIGHT}px`);
    return () => {
      document.documentElement.style.setProperty('--nav-height', '0px');
    };
  }, []);

  const create = () => {
    haptics.selection();
    navigate('/tests/new');
  };

  return (
    <nav
      aria-label={t('nav.home')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 backdrop-blur-[12px]"
      style={{ height: `calc(${NAV_HEIGHT}px + var(--safe-bottom))` }}
    >
      <div className="mx-auto flex h-[64px] w-full max-w-content items-stretch px-2">
        {LEFT_ITEMS.map((item) => (
          <NavItemLink key={item.to} item={item} onPress={() => haptics.selection()} />
        ))}

        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={create}
            aria-label={t('home.newTest')}
            className="-mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary transition-colors duration-150 hover:bg-primary-hover"
            style={{ boxShadow: 'var(--shadow-raised)' }}
          >
            <Plus size={24} strokeWidth={2} />
          </button>
        </div>

        {RIGHT_ITEMS.map((item) => (
          <NavItemLink key={item.to} item={item} onPress={() => haptics.selection()} />
        ))}
      </div>
    </nav>
  );
}

function NavItemLink({ item, onPress }: { item: NavItem; onPress: () => void }) {
  const { t } = useTranslation();
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onPress}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5"
    >
      {({ isActive }) => (
        <>
          <Icon
            size={22}
            strokeWidth={1.75}
            className={cn(
              'transition-colors duration-150',
              isActive ? 'text-primary' : 'text-text-muted',
            )}
          />
          <span
            className={cn(
              'max-w-full truncate px-0.5 text-[11px] leading-none transition-colors duration-150',
              isActive ? 'font-medium text-primary' : 'text-text-muted',
            )}
          >
            {t(item.labelKey)}
          </span>
          <span
            className={cn(
              'mt-0.5 h-1 w-1 rounded-full transition-colors duration-150',
              isActive ? 'bg-primary' : 'bg-transparent',
            )}
          />
        </>
      )}
    </NavLink>
  );
}
