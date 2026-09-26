import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { useCurrentUser } from '@/store/session';
import { useAdminOverview, useSetUserBlocked, useTests, useUsers } from '@/hooks/queries';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/StateViews';
import { Tabs } from '@/components/Tabs';
import { TestStatusBadge, TestTypeBadge } from '@/components/TestTypeBadge';

type AdminTab = 'users' | 'tests';

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState<AdminTab>('users');
  const overview = useAdminOverview(isAdmin);
  const users = useUsers(isAdmin && tab === 'users');
  const tests = useTests({}, isAdmin && tab === 'tests');
  const setBlocked = useSetUserBlocked();

  usePrimaryAction(null);

  if (!isAdmin) {
    return (
      <Page>
        <PageHeader title={t('admin.title')} onBack="auto" />
        <EmptyState
          illustration={<ShieldOff size={44} strokeWidth={1.25} className="text-text-muted" />}
          title={t('admin.noAccess')}
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title={t('admin.title')} onBack="auto" />

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Tile label={t('admin.totalUsers')} value={overview.data?.users ?? 0} />
        <Tile label={t('admin.totalTests')} value={overview.data?.tests ?? 0} />
        <Tile label={t('admin.totalAttempts')} value={overview.data?.attempts ?? 0} />
      </div>

      <Tabs<AdminTab>
        className="mb-4"
        variant="underline"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'users', label: t('admin.tabUsers') },
          { value: 'tests', label: t('admin.tabTests') },
        ]}
      />

      {tab === 'users' &&
        (users.isPending ? (
          <LoadingState />
        ) : (
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full min-w-[420px] text-small">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 pr-2 font-medium">{t('admin.colUser')}</th>
                  <th className="py-2 pr-2 font-medium">{t('admin.colRole')}</th>
                  <th className="py-2 pr-2 font-medium">{t('admin.colCreated')}</th>
                  <th className="py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {(users.data ?? []).slice(0, 60).map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-2">
                      <span className="flex items-center gap-2">
                        <Avatar
                          name={`${row.firstName} ${row.lastName ?? ''}`}
                          photoUrl={row.photoUrl}
                          size={26}
                        />
                        <span className="truncate text-text">
                          {row.firstName} {row.lastName}
                        </span>
                        {row.isBlocked && <Badge tone="danger">{t('admin.blocked')}</Badge>}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-text-muted">
                      {t(`profile.role${row.role.charAt(0).toUpperCase()}${row.role.slice(1)}`)}
                    </td>
                    <td className="py-2 pr-2 text-text-muted">
                      {formatDate(row.createdAt, i18n.language)}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant={row.isBlocked ? 'secondary' : 'ghost'}
                        loading={setBlocked.isPending && setBlocked.variables?.id === row.id}
                        onClick={() => setBlocked.mutate({ id: row.id, blocked: !row.isBlocked })}
                      >
                        {row.isBlocked ? t('admin.unblock') : t('admin.block')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'tests' &&
        (tests.isPending ? (
          <LoadingState />
        ) : (
          <div className="flex flex-col gap-2">
            {(tests.data ?? []).map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => navigate(`/tests/${test.id}/manage`)}
                className="card flex items-center gap-2 p-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-text">{test.title}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <TestTypeBadge type={test.type} />
                    <TestStatusBadge status={test.status} />
                  </span>
                </span>
                <span className="tnum shrink-0 text-small text-text-muted">
                  {test.participantCount}
                </span>
              </button>
            ))}
          </div>
        ))}
    </Page>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card bg-surface px-3 py-2.5">
      <p className="tnum text-[20px] font-semibold text-text">{value}</p>
      <p className="text-small leading-tight text-text-muted">{label}</p>
    </div>
  );
}
