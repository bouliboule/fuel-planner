import { useState } from 'react';
import { t, type MessageKey } from '../../i18n/index.ts';
import type { Profile, WeekTemplate } from '../../model/index.ts';
import { Button, SelectField, TextField } from '../../ui/form.tsx';
import { KcalPreview } from '../sessions/KcalPreview.tsx';
import { SessionFields } from '../sessions/SessionFields.tsx';
import {
  emptySessionDraft,
  type SessionErrors,
} from '../sessions/sessionDraft.ts';
import {
  newUid,
  templateFromDraft,
  type TemplateDraft,
  type TemplateSessionDraft,
} from './templateDraft.ts';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function TemplateEditor({
  draft,
  onChange,
  onSave,
  profile,
  saveLabel,
}: {
  draft: TemplateDraft;
  onChange: (draft: TemplateDraft) => void;
  onSave: (template: WeekTemplate) => void;
  profile?: Profile | undefined;
  saveLabel: string;
}) {
  const [nameError, setNameError] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, SessionErrors>>({});
  const setSession = (uid: string, next: TemplateSessionDraft) => {
    onChange({
      ...draft,
      sessions: draft.sessions.map((s) => (s.uid === uid ? next : s)),
    });
  };
  const sorted = [...draft.sessions].sort((a, b) => a.weekday - b.weekday);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const result = templateFromDraft(draft);
        if (result.ok) {
          setNameError(undefined);
          setErrors({});
          onSave(result.template);
        } else {
          setNameError(result.nameError);
          setErrors(result.sessionErrors);
        }
      }}
    >
      <TextField
        label={t('templates.name')}
        value={draft.name}
        onChange={(name) => {
          onChange({ ...draft, name });
        }}
        error={nameError}
      />
      {sorted.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">{t('templates.empty')}</p>
      )}
      {sorted.map((s) => (
        <fieldset
          key={s.uid}
          className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
          aria-label={`${t(`weekday.${String(s.weekday)}` as MessageKey)} ${s.title}`}
        >
          <SelectField
            label={t('session.weekday')}
            value={String(s.weekday)}
            onChange={(v) => {
              setSession(s.uid, { ...s, weekday: Number(v) });
            }}
            options={WEEKDAYS.map((d) => ({
              value: String(d),
              label: t(`weekday.${String(d)}` as MessageKey),
            }))}
          />
          <SessionFields
            draft={s}
            onChange={(next) => {
              setSession(s.uid, { ...next, uid: s.uid, weekday: s.weekday });
            }}
            errors={errors[s.uid] ?? {}}
          />
          {profile && <KcalPreview draft={s} profile={profile} />}
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                onChange({
                  ...draft,
                  sessions: draft.sessions.filter((x) => x.uid !== s.uid),
                });
              }}
            >
              {t('templates.removeSession')}
            </Button>
          </div>
        </fieldset>
      ))}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {t('form.fixErrors')}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            onChange({
              ...draft,
              sessions: [
                ...draft.sessions,
                { ...emptySessionDraft('ride'), uid: newUid(), weekday: 1 },
              ],
            });
          }}
        >
          {t('templates.addSession')}
        </Button>
        <Button type="submit">{saveLabel}</Button>
      </div>
    </form>
  );
}
