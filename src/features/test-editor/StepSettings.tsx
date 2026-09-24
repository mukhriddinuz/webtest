import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import type { AccessMode, ResultVisibility, Test, TestSettings } from '@/services/types';
import { uid } from '@/lib/id';
import { parseNumeric } from '@/lib/grading';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Switch } from '@/components/Switch';
import { Button, IconButton } from '@/components/Button';
import { CardTitle } from '@/components/Card';

/** ISO string <-> value accepted by `<input type="datetime-local">`. */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function StepSettings({
  test,
  onPatch,
}: {
  test: Test;
  onPatch: (patch: { settings: Partial<TestSettings> }) => void;
}) {
  const { t } = useTranslation();
  const settings = test.settings;
  const patch = (next: Partial<TestSettings>) => onPatch({ settings: next });

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-section-title text-text">{t('wizard.settings')}</h2>

      {test.type !== 'live' && (
        <Input
          label={t('settings.duration')}
          hint={t('settings.durationHint')}
          inputMode="numeric"
          className="tnum"
          value={settings.durationMin ?? ''}
          onChange={(event) => {
            const parsed = parseNumeric(event.target.value);
            patch({ durationMin: parsed === null ? null : Math.max(1, Math.round(parsed)) });
          }}
        />
      )}

      {test.type === 'contest' && (
        <section className="flex flex-col gap-3">
          <CardTitle>{t('settings.window')}</CardTitle>
          <Input
            label={t('settings.startsAt')}
            type="datetime-local"
            value={toLocalInput(settings.startsAt)}
            onChange={(event) => patch({ startsAt: fromLocalInput(event.target.value) })}
          />
          <Input
            label={t('settings.endsAt')}
            type="datetime-local"
            value={toLocalInput(settings.endsAt)}
            onChange={(event) => patch({ endsAt: fromLocalInput(event.target.value) })}
          />
        </section>
      )}

      {test.type === 'limited' && (
        <Input
          label={t('settings.participantLimit')}
          inputMode="numeric"
          className="tnum"
          value={settings.participantLimit ?? ''}
          onChange={(event) =>
            patch({
              participantLimit: Math.max(1, Math.round(parseNumeric(event.target.value) ?? 1)),
            })
          }
        />
      )}

      <Input
        label={t('settings.attemptLimit')}
        inputMode="numeric"
        className="tnum"
        value={settings.attemptLimit}
        onChange={(event) =>
          patch({ attemptLimit: Math.max(1, Math.round(parseNumeric(event.target.value) ?? 1)) })
        }
      />

      <Select
        label={t('settings.access')}
        value={settings.access}
        onChange={(event) => {
          const access = event.target.value as AccessMode;
          patch({
            access,
            inviteCode:
              access === 'invite'
                ? (settings.inviteCode ?? uid().toUpperCase().slice(0, 8))
                : settings.inviteCode,
          });
        }}
        options={[
          { value: 'open', label: t('settings.accessOpen') },
          { value: 'password', label: t('settings.accessPassword') },
          { value: 'invite', label: t('settings.accessInvite') },
        ]}
      />

      {settings.access === 'password' && (
        <Input
          label={t('settings.password')}
          value={settings.password ?? ''}
          onChange={(event) => patch({ password: event.target.value })}
        />
      )}

      {settings.access === 'invite' && (
        <Input
          label={t('settings.inviteCode')}
          className="tnum"
          value={settings.inviteCode ?? ''}
          onChange={(event) => patch({ inviteCode: event.target.value.toUpperCase() })}
        />
      )}

      <section className="flex flex-col gap-2">
        <CardTitle>{t('settings.channels')}</CardTitle>
        <p className="text-small text-text-muted">{t('settings.channelsHint')}</p>
        {settings.requiredChannels.map((channel, index) => (
          <div key={channel.id} className="flex items-end gap-2">
            <Input
              label={index === 0 ? t('settings.channelTitle') : undefined}
              value={channel.title}
              onChange={(event) =>
                patch({
                  requiredChannels: settings.requiredChannels.map((item) =>
                    item.id === channel.id ? { ...item, title: event.target.value } : item,
                  ),
                })
              }
            />
            <Input
              label={index === 0 ? t('settings.channelUsername') : undefined}
              value={channel.username}
              onChange={(event) =>
                patch({
                  requiredChannels: settings.requiredChannels.map((item) =>
                    item.id === channel.id
                      ? { ...item, username: event.target.value.replace('@', '') }
                      : item,
                  ),
                })
              }
            />
            <IconButton
              label={t('common.delete')}
              tone="danger"
              onClick={() =>
                patch({
                  requiredChannels: settings.requiredChannels.filter(
                    (item) => item.id !== channel.id,
                  ),
                })
              }
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </IconButton>
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={15} strokeWidth={1.75} />}
          onClick={() =>
            patch({
              requiredChannels: [
                ...settings.requiredChannels,
                { id: uid('ch'), title: '', username: '' },
              ],
            })
          }
        >
          {t('settings.addChannel')}
        </Button>
      </section>

      <section className="flex flex-col divide-y divide-border">
        <Switch
          checked={settings.shuffleQuestions}
          onChange={(shuffleQuestions) => patch({ shuffleQuestions })}
          label={t('settings.shuffleQuestions')}
        />
        <Switch
          checked={settings.shuffleOptions}
          onChange={(shuffleOptions) => patch({ shuffleOptions })}
          label={t('settings.shuffleOptions')}
        />
        <Switch
          checked={settings.allowBack}
          onChange={(allowBack) => patch({ allowBack })}
          label={t('settings.allowBack')}
        />
        <Switch
          checked={settings.showCorrectAnswers}
          onChange={(showCorrectAnswers) => patch({ showCorrectAnswers })}
          label={t('settings.showCorrectAnswers')}
        />
        <Switch
          checked={settings.antiCheat}
          onChange={(antiCheat) => patch({ antiCheat })}
          label={t('settings.antiCheat')}
          hint={t('settings.antiCheatHint')}
        />
      </section>

      <Input
        label={t('settings.penalty')}
        hint={t('settings.penaltyHint')}
        inputMode="decimal"
        className="tnum"
        value={settings.penaltyPoints}
        onChange={(event) =>
          patch({ penaltyPoints: Math.max(0, parseNumeric(event.target.value) ?? 0) })
        }
      />

      <Select
        label={t('settings.showResult')}
        value={settings.showResult}
        onChange={(event) => patch({ showResult: event.target.value as ResultVisibility })}
        options={[
          { value: 'immediately', label: t('settings.showResultImmediately') },
          { value: 'after_finish', label: t('settings.showResultAfterFinish') },
          { value: 'never', label: t('settings.showResultNever') },
        ]}
      />

      {test.type === 'live' && (
        <Input
          label={t('settings.speedBonus')}
          hint={t('settings.speedBonusHint')}
          inputMode="decimal"
          className="tnum"
          value={settings.speedBonus}
          onChange={(event) => {
            const parsed = parseNumeric(event.target.value) ?? 0;
            patch({ speedBonus: Math.min(1, Math.max(0, parsed)) });
          }}
        />
      )}
    </div>
  );
}
