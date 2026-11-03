import { useState } from 'react';
import { t, type MessageKey } from '../../i18n/index.ts';
import type { Profile, WeekTemplate } from '../../model/index.ts';
import { Button, CheckboxField } from '../../ui/form.tsx';
import { TemplateEditor } from '../templates/TemplateEditor.tsx';
import {
  draftFromSeed,
  seedStrengthSessions,
  type TemplateDraft,
} from '../templates/templateDraft.ts';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** First run, step 3: start from the seed standard week or skip (D29). */
export function WeekStep({
  profile,
  onBack,
  onDone,
}: {
  profile: Profile;
  onBack: () => void;
  onDone: (template: WeekTemplate | undefined) => void;
}) {
  const [draft, setDraft] = useState<TemplateDraft | undefined>();
  const [strengthDays, setStrengthDays] = useState<number[]>([]);

  const toggleStrength = (day: number, on: boolean) => {
    if (!draft) return;
    const days = on
      ? [...strengthDays, day]
      : strengthDays.filter((d) => d !== day);
    setStrengthDays(days);
    const kept = draft.sessions.filter((s) => !s.uid.startsWith('strength-'));
    const existing = new Map(
      draft.sessions
        .filter((s) => s.uid.startsWith('strength-'))
        .map((s) => [s.uid, s]),
    );
    const strength = seedStrengthSessions(days).map(
      (s) => existing.get(s.uid) ?? s,
    );
    setDraft({ ...draft, sessions: [...kept, ...strength] });
  };

  return (
    <section>
      <h2 className="mt-6 text-lg font-semibold">{t('firstRun.week')}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {t('firstRun.weekIntro')}
      </p>
      {!draft ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onBack}>
            {t('common.back')}
          </Button>
          <Button
            onClick={() => {
              setDraft(draftFromSeed());
            }}
          >
            {t('firstRun.useStandard')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onDone(undefined);
            }}
          >
            {t('firstRun.skipWeek')}
          </Button>
        </div>
      ) : (
        <>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium">
              {t('firstRun.strengthDays')}
            </legend>
            <div className="grid grid-cols-2 gap-x-4">
              {WEEKDAYS.map((d) => (
                <CheckboxField
                  key={d}
                  label={t(`weekday.${String(d)}` as MessageKey)}
                  checked={strengthDays.includes(d)}
                  onChange={(on) => {
                    toggleStrength(d, on);
                  }}
                />
              ))}
            </div>
          </fieldset>
          <TemplateEditor
            draft={draft}
            onChange={setDraft}
            profile={profile}
            saveLabel={t('common.next')}
            onSave={onDone}
          />
          <div className="mt-2">
            <Button
              variant="secondary"
              onClick={() => {
                onDone(undefined);
              }}
            >
              {t('firstRun.skipWeek')}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
