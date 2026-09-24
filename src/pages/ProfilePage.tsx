import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Award, BarChart3, FileCheck2, FilePlus2, ShieldCheck } from 'lucide-react';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import { useCurrentUser } from '@/store/session';
import { useUiStore, type ThemePreference } from '@/store/ui';
import { useUserStats } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card, CardTitle } from '@/components/Card';
import { Select } from '@/components/Select';
import { Badge } from '@/components/Badge';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const stats = useUserStats(user?.id);
  const { themePreference, setThemePreference, language, setLanguage } = useUiStore();

  usePrimaryAction(null);

  if (!user) return null;

  const roleKey = `profile.role${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`;

  return (
    <Page>
      <PageHeader title={t('profile.title')} />

      <Card className="mb-4 flex items-center gap-3">
        <Avatar
          name={`${user.firstName} ${user.lastName ?? ''}`}
          photoUrl={user.photoUrl}
          size={56}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-card-title text-text">
            {user.firstName} {user.lastName}
          </p>
          {user.username && <p className="truncate text-small text-text-muted">@{user.username}</p>}
          <div className="mt-1.5">
            <Badge tone={user.role === 'admin' ? 'danger' : 'primary'}>{t(roleKey)}</Badge>
          </div>
        </div>
      </Card>

      <section className="mb-4">
        <CardTitle className="mb-2">{t('profile.stats')}</CardTitle>
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

      <section className="flex flex-col gap-3">
        <CardTitle>{t('profile.preferences')}</CardTitle>
        <Select
          label={t('profile.language')}
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          options={SUPPORTED_LANGUAGES.map((code) => ({
            value: code,
            label: LANGUAGE_LABELS[code],
          }))}
        />
        <Select
          label={t('profile.theme')}
          value={themePreference}
          onChange={(event) => setThemePreference(event.target.value as ThemePreference)}
          options={[
            { value: 'system', label: t('profile.themeSystem') },
            { value: 'light', label: t('profile.themeLight') },
            { value: 'dark', label: t('profile.themeDark') },
          ]}
        />

        {/* The admin area has no other entry point. */}
        {user.role === 'admin' && (
          <Button
            variant="secondary"
            fullWidth
            icon={<ShieldCheck size={16} strokeWidth={1.75} />}
            onClick={() => navigate('/admin')}
          >
            {t('admin.title')}
          </Button>
        )}
      </section>
    </Page>
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
    <div className="rounded-card border border-border bg-surface p-3">
      <span className="mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <p className="tnum text-[20px] font-semibold text-text">{value}</p>
      <p className="text-small text-text-muted">{label}</p>
    </div>
  );
}
