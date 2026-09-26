import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { api } from '@/services';
import { getMockBridge } from '@/lib/telegram';
import { SEED_USERS } from '@/mocks/users';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import { LATENCY_OPTIONS, useDevStore, type Latency } from '@/store/dev';
import { useSessionStore } from '@/store/session';
import { useUiStore, type ThemePreference } from '@/store/ui';
import { toast } from '@/store/toast';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Switch } from '@/components/Switch';
import { cn } from '@/lib/cn';

/**
 * Development affordances required by the spec: switch demo user, theme and
 * language, tune the simulated network and restore the seed data.
 */
export function DevPanelSheet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const open = useDevStore((state) => state.panelOpen);
  const setPanelOpen = useDevStore((state) => state.setPanelOpen);
  const user = useSessionStore((state) => state.user);
  const setDevUserId = useSessionStore((state) => state.setDevUserId);
  const { themePreference, setThemePreference, language, setLanguage } = useUiStore();
  const {
    latencyMs,
    setLatency,
    errorRate,
    setErrorRate,
    channelCheckPasses,
    setChannelCheckPasses,
  } = useDevStore();

  const mock = getMockBridge();

  const reset = async () => {
    setResetting(true);
    try {
      await api.reset();
      client.clear();
      toast.success(t('dev.resetDone'));
      setConfirmReset(false);
      setPanelOpen(false);
      navigate('/', { replace: true });
      window.location.reload();
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={() => setPanelOpen(false)}
        title={t('dev.title')}
        closeLabel={t('common.close')}
        tall
      >
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h3 className="text-small font-medium text-text-muted">{t('dev.user')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {SEED_USERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDevUserId(item.id);
                    mock?.setUser({
                      id: item.telegramId,
                      firstName: item.firstName,
                      lastName: item.lastName,
                      username: item.username,
                    });
                    setPanelOpen(false);
                  }}
                  className={cn(
                    'rounded-control border p-3 text-left transition-colors duration-150',
                    user?.id === item.id
                      ? 'border-primary bg-primary-soft'
                      : 'border-border bg-surface active:bg-surface-muted',
                  )}
                >
                  <span className="block text-body text-text">
                    {item.firstName} {item.lastName}
                  </span>
                  <span className="block text-small text-text-muted">
                    {t(`profile.role${item.role.charAt(0).toUpperCase()}${item.role.slice(1)}`)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-small font-medium text-text-muted">{t('dev.theme')}</h3>
            <SegmentedRow<ThemePreference>
              value={themePreference}
              onChange={setThemePreference}
              options={[
                { value: 'light', label: t('profile.themeLight') },
                { value: 'dark', label: t('profile.themeDark') },
                { value: 'system', label: t('profile.themeSystem') },
              ]}
            />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-small font-medium text-text-muted">{t('dev.language')}</h3>
            <SegmentedRow<Language>
              value={language}
              onChange={setLanguage}
              options={SUPPORTED_LANGUAGES.map((code) => ({
                value: code,
                label: LANGUAGE_LABELS[code],
              }))}
            />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-small font-medium text-text-muted">{t('dev.latency')}</h3>
            <SegmentedRow<Latency>
              value={latencyMs}
              onChange={setLatency}
              options={LATENCY_OPTIONS.map((value) => ({ value, label: `${value} ms` }))}
            />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-small font-medium text-text-muted">{t('dev.errorRate')}</h3>
            <SegmentedRow<number>
              value={errorRate}
              onChange={setErrorRate}
              options={[
                { value: 0, label: '0%' },
                { value: 0.3, label: '30%' },
                { value: 1, label: '100%' },
              ]}
            />
          </section>

          <Switch
            checked={channelCheckPasses}
            onChange={setChannelCheckPasses}
            label={t('testPage.checkSubscription')}
            hint={t('settings.channelsHint')}
          />

          <div className="flex flex-col gap-2">
            {import.meta.env.DEV && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setPanelOpen(false);
                  navigate('/dev/ui');
                }}
              >
                {t('dev.uiKit')}
              </Button>
            )}
            <Button
              variant="danger"
              fullWidth
              icon={<RotateCcw size={16} strokeWidth={1.75} />}
              onClick={() => setConfirmReset(true)}
            >
              {t('dev.reset')}
            </Button>
          </div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confirmReset}
        tone="danger"
        loading={resetting}
        title={t('dev.reset')}
        description={t('dev.resetConfirm')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => void reset()}
      />
    </>
  );
}

function SegmentedRow<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-control bg-surface-muted p-1">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-[9px] px-2 py-2 text-small transition-colors duration-150',
            value === option.value
              ? 'bg-surface text-text shadow-sm'
              : 'text-text-muted hover:text-text',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
