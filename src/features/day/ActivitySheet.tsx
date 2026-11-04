import { useState } from 'react';
import { backToBackWarnings } from '../../engine/backToBack.ts';
import { db, deleteSession, saveSession } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import {
  effortSchema,
  runTypeSchema,
  sportSchema,
  zoneSchema,
  type Profile,
  type StoredSession,
} from '../../model/index.ts';
import { Choice } from '../../ui/Choice.tsx';
import {
  Button,
  CheckboxField,
  NumberField,
  TextField,
} from '../../ui/form.tsx';
import { SPORT_ICON } from '../../ui/icons.ts';
import { Sheet } from '../../ui/Sheet.tsx';
import { KcalPreview } from '../sessions/KcalPreview.tsx';
import { WarningText } from './WarningText.tsx';
import {
  MODES_BY_SPORT,
  draftFromSession,
  emptySessionDraft,
  sessionFromDraft,
  type SessionDraft,
  type SessionErrors,
} from '../sessions/sessionDraft.ts';

// Quick picks for the duration; any other value goes in the custom field.
const DURATIONS = ['30', '45', '60', '90', '120', '180', '240'] as const;

/** Add or edit one activity of `date`. */
export function ActivitySheet({
  date,
  existing,
  profile,
  dayBefore,
  dayAfter,
  onClose,
}: {
  date: string;
  existing?: StoredSession | undefined;
  profile: Profile;
  /** Sessions of the neighbouring days, for the D53 warning. */
  dayBefore: readonly StoredSession[];
  dayAfter: readonly StoredSession[];
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SessionDraft>(() =>
    existing ? draftFromSession(existing) : emptySessionDraft('ride'),
  );
  const [errors, setErrors] = useState<SessionErrors>({});
  const [more, setMore] = useState(
    () => draft.mode !== MODES_BY_SPORT[draft.sport][0],
  );
  const set = <K extends keyof SessionDraft>(
    key: K,
    value: SessionDraft[K],
  ) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };
  const modes = MODES_BY_SPORT[draft.sport];
  const custom = !(DURATIONS as readonly string[]).includes(draft.durationMin);
  // Live D53 warning while editing; saving is never blocked.
  const parsed = sessionFromDraft(draft);
  const backToBack = parsed.ok
    ? backToBackWarnings({
        session: { ...parsed.session, date, id: existing?.id ?? 'draft' },
        dayBefore,
        dayAfter,
        profile,
      })
    : [];

  return (
    <Sheet
      title={t(existing ? 'activity.edit' : 'activity.new')}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const r = sessionFromDraft(draft);
          if (!r.ok) {
            setErrors(r.errors);
            return;
          }
          void saveSession(db, { ...r.session, date }, existing).then(onClose);
        }}
      >
        <Choice
          label={t('session.sport')}
          value={draft.sport}
          options={sportSchema.options.map((s) => ({
            value: s,
            label: t(`sport.${s}`),
            icon: SPORT_ICON[s],
          }))}
          onChange={(sport) => {
            // A new sport keeps the shared fields and resets the intensity.
            setDraft((d) => ({
              ...emptySessionDraft(sport),
              title: d.title,
              start: d.start,
              durationMin: d.durationMin,
              key: d.key,
            }));
            setMore(false);
          }}
        />
        <TextField
          type="time"
          label={t('session.start')}
          value={draft.start}
          onChange={(v) => {
            set('start', v);
          }}
          error={errors.start}
        />
        <Choice
          label={t('activity.duration')}
          value={custom ? undefined : draft.durationMin}
          options={DURATIONS.map((m) => ({
            value: m,
            label: t('activity.minutes', { minutes: m }),
          }))}
          onChange={(v) => {
            set('durationMin', v);
          }}
        />
        <NumberField
          integer
          label={t('activity.custom')}
          value={custom ? draft.durationMin : ''}
          onChange={(v) => {
            set('durationMin', v);
          }}
          error={errors.durationMin}
        />

        {draft.mode === 'zone' && (
          <Choice
            label={t('activity.intensity')}
            value={draft.zone}
            options={zoneSchema.options.map((z) => ({
              value: z,
              label: t(`zone.${z}`),
            }))}
            onChange={(v) => {
              set('zone', v);
            }}
          />
        )}
        {draft.mode === 'effort' && (
          <Choice
            label={t('activity.intensity')}
            value={draft.effort}
            options={effortSchema.options.map((v) => ({
              value: v,
              label: t(`effort.${v}`),
            }))}
            onChange={(v) => {
              set('effort', v);
            }}
          />
        )}
        {draft.sport === 'run' && (
          <Choice
            label={t('runType.label')}
            value={draft.runType}
            options={runTypeSchema.options.map((v) => ({
              value: v,
              label: t(`runType.${v}`),
            }))}
            onChange={(v) => {
              set('runType', v);
            }}
          />
        )}
        {draft.mode === 'kj' && (
          <NumberField
            integer
            label={t('session.kj')}
            value={draft.kj}
            onChange={(v) => {
              set('kj', v);
            }}
            error={errors.kj}
          />
        )}
        {draft.mode === 'pace' && (
          <TextField
            label={t('session.pace')}
            value={draft.pace}
            onChange={(v) => {
              set('pace', v);
            }}
            hint={t('session.paceHint')}
            error={errors.pace}
          />
        )}
        {draft.mode === 'distance' && (
          <NumberField
            label={t('session.distance')}
            value={draft.distanceKm}
            onChange={(v) => {
              set('distanceKm', v);
            }}
            hint={t('session.distanceHint')}
            error={errors.distanceKm}
          />
        )}
        {draft.mode === 'met' && (
          <NumberField
            label={t('session.met')}
            value={draft.met}
            onChange={(v) => {
              set('met', v);
            }}
            hint={t('session.metHint')}
            error={errors.met}
          />
        )}
        {modes.length > 1 && (
          <button
            type="button"
            className="mt-3 min-h-11 text-amber-700 dark:text-amber-400"
            onClick={() => {
              const next = !more;
              setMore(next);
              set('mode', (next ? modes[1] : modes[0]) ?? draft.mode);
            }}
          >
            {more
              ? t('activity.less')
              : `${t('activity.more')}: ${t(`mode.${modes[1] ?? modes[0] ?? 'met'}`)}`}
          </button>
        )}

        <CheckboxField
          label={t('session.key')}
          checked={draft.key}
          onChange={(v) => {
            set('key', v);
          }}
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('activity.keyHint')}
        </p>

        <div data-testid="back-to-back">
          {backToBack.map((w) => (
            <WarningText key={w.code} warning={w} />
          ))}
        </div>

        <KcalPreview draft={draft} profile={profile} />

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="submit">{t('activity.save')}</Button>
          {existing && (
            <Button
              variant="danger"
              onClick={() => {
                void deleteSession(db, existing.id).then(onClose);
              }}
            >
              {t('activity.delete')}
            </Button>
          )}
        </div>
      </form>
    </Sheet>
  );
}
