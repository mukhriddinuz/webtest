import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  FileCheck2,
  FilePlus2,
  Languages,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import { useCurrentUser } from '@/store/session';
import { useUiStore, type ThemePreference } from '@/store/ui';
import { useUserStats } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Avatar } from '@/components/Avatar';
import { SectionHeader } from '@/components/Card';
import { ListRow, ListSection } from '@/components/ListSection';
import { PickerSheet } from '@/components/PickerSheet';
import { Badge } from '@/components/Badge';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const stats = useUserStats(user?.id);
  const { themePreference, setThemePreference, language, setLanguage } = useUiStore();
  const [picker, setPicker] = useState<'language' | 'theme' | null>(null);

  const THEMES: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('profile.themeSystem') },
    { value: 'light', label: t('profile.themeLight') },
    { value: 'dark', label: t('profile.themeDark') },
  ];

  usePrimaryAction(null);

  if (!user) return null;

  const roleKey = `profile.role${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`;

  return (
    <Page>
      <PageHeader title={t('profile.title')} />

      {/* Telegram-style profile header: centered avatar, name and handle. */}
      <div className="mb-5 flex flex-col items-center text-center">
        <Avatar
          name={`${user.firstName} ${user.lastName ?? ''}`}
          photoUrl={user.photoUrl}
          size={88}
        />
        <p className="mt-3 max-w-full truncate text-[22px] font-semibold leading-tight text-text">
          {user.firstName} {user.lastName}
        </p>
        {user.username && (
          <p className="max-w-full truncate text-body text-text-muted">@{user.username}</p>
        )}
        <div className="mt-2">
          <Badge tone={user.role === 'admin' ? 'danger' : 'primary'}>{t(roleKey)}</Badge>
        </div>
      </div>

      <section className="mb-5">
        <SectionHeader className="px-1">{t('profile.stats')}</SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<FileCheck2 size={18} strokeWidth={1.75} />}
            label={t('profile.testsTaken')}
            value={stats.data?.taken ?? 0}
          />
          <StatCard
            icon={<FilePlus2 size={18} strokeWidth={1.75} />}
            label={t('profile.testsCreated')}
            value={stats.data?.created ?? 0}
          />
          <StatCard
            icon={<BarChart3 size={18} strokeWidth={1.75} />}
            label={t('profile.averageScore')}
            value={`${stats.data?.averagePercent ?? 0}%`}
          />
          <StatCard
            icon={<Award size={18} strokeWidth={1.75} />}
            label={t('profile.bestScore')}
            value={`${stats.data?.bestPercent ?? 0}%`}
          />
        </div>
      </section>

      <ListSection header={t('profile.preferences')}>
        <ListRow
          icon={<Languages size={16} strokeWidth={1.75} />}
          title={t('profile.language')}
          value={LANGUAGE_LABELS[language]}
          onClick={() => setPicker('language')}
        />
        <ListRow
          icon={<Palette size={16} strokeWidth={1.75} />}
          iconClassName="bg-accent text-on-accent"
          title={t('profile.theme')}
          value={THEMES.find((item) => item.value === themePreference)?.label}
          onClick={() => setPicker('theme')}
        />
        {/* The admin area has no other entry point. */}
        {user.role === 'admin' && (
          <ListRow
            icon={<ShieldCheck size={16} strokeWidth={1.75} />}
            iconClassName="bg-danger text-on-primary"
            title={t('admin.title')}
            onClick={() => navigate('/admin')}
          />
        )}
      </ListSection>

      <PickerSheet
        open={picker === 'language'}
        title={t('profile.language')}
        value={language}
        options={SUPPORTED_LANGUAGES.map((code) => ({ value: code, label: LANGUAGE_LABELS[code] }))}
        onSelect={(next) => setLanguage(next as Language)}
        onClose={() => setPicker(null)}
        closeLabel={t('common.close')}
      />

      <PickerSheet
        open={picker === 'theme'}
        title={t('profile.theme')}
        value={themePreference}
        options={THEMES}
        onSelect={setThemePreference}
        onClose={() => setPicker(null)}
        closeLabel={t('common.close')}
      />

      <BuildStamp />
    </Page>
  );
}

/**
 * Which build is running. Without it there is no way to tell a webview showing
 * a cached release from a deploy that never happened.
 */
function BuildStamp() {
  const built = new Date(__BUILD_TIME__);
  const stamp = Number.isNaN(built.getTime())
    ? ''
    : built.toISOString().slice(0, 16).replace('T', ' ');
  return (
    <p className="mt-6 text-center text-small text-text-muted">
      TestHub · {__BUILD_ID__} · {stamp}
    </p>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-card bg-surface p-3">
      <span className="mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary text-on-primary">
        {icon}
      </span>
      <p className="tnum text-[20px] font-semibold text-text">{value}</p>
      <p className="text-small text-text-muted">{label}</p>
    </div>
  );
}
