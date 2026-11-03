import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  db,
  deleteSession,
  getSession,
  saveSession,
  useLiveQuery,
} from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import type { StoredProfile, StoredSession } from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { useProfile } from '../settings/useProfile.ts';
import { KcalPreview } from './KcalPreview.tsx';
import { SessionFields } from './SessionFields.tsx';
import {
  draftFromSession,
  emptySessionDraft,
  sessionFromDraft,
  type SessionDraft,
  type SessionErrors,
} from './sessionDraft.ts';

/** /sessions/new?date=YYYY-MM-DD and /sessions/:id */
export function SessionScreen() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const profile = useProfile();
  const existing = useLiveQuery(
    async () => (id ? ((await getSession(db, id)) ?? null) : null),
    [id],
  );
  if (profile.loading || !profile.value || existing.loading) return null;
  const date = existing.value?.date ?? params.get('date') ?? '';
  return (
    <Screen title={id ? t('session.edit') : t('session.new')}>
      <BackLink to={`/week/${date}`} />
      <p className="text-sm text-slate-500">{date}</p>
      <SessionForm
        key={existing.value?.id ?? 'new'}
        profile={profile.value}
        date={date}
        existing={existing.value ?? undefined}
      />
    </Screen>
  );
}

function SessionForm({
  profile,
  date,
  existing,
}: {
  profile: StoredProfile;
  date: string;
  existing: StoredSession | undefined;
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<SessionDraft>(() =>
    existing ? draftFromSession(existing) : emptySessionDraft('ride'),
  );
  const [errors, setErrors] = useState<SessionErrors>({});
  const back = () => navigate(`/week/${date}`);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const result = sessionFromDraft(draft);
        if (!result.ok) {
          setErrors(result.errors);
          return;
        }
        setErrors({});
        void saveSession(
          db,
          {
            ...result.session,
            date,
            source: existing?.source ?? 'manual',
            ...(existing?.templateId === undefined
              ? {}
              : { templateId: existing.templateId }),
          },
          existing,
        ).then(back);
      }}
    >
      <SessionFields draft={draft} onChange={setDraft} errors={errors} />
      <KcalPreview draft={draft} profile={profile} />
      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="submit">{t('common.save')}</Button>
        {existing && (
          <Button
            variant="danger"
            onClick={() => {
              void deleteSession(db, existing.id).then(back);
            }}
          >
            {t('session.delete')}
          </Button>
        )}
      </div>
    </form>
  );
}
