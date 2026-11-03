import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  db,
  getTemplate,
  saveTemplate,
  useLiveQuery,
  type StoredWeekTemplate,
} from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { useProfile } from '../settings/useProfile.ts';
import { TemplateEditor } from './TemplateEditor.tsx';
import { draftFromTemplate, type TemplateDraft } from './templateDraft.ts';

/** /templates/new and /templates/:id */
export function TemplateScreen() {
  const { id } = useParams();
  const existing = useLiveQuery(
    async () => (id ? ((await getTemplate(db, id)) ?? null) : null),
    [id],
  );
  if (existing.loading) return null;
  return (
    <Screen title={id ? t('templates.edit') : t('templates.new')}>
      <BackLink to="/templates" />
      <Editor
        key={existing.value?.id ?? 'new'}
        existing={existing.value ?? undefined}
      />
    </Screen>
  );
}

function Editor({ existing }: { existing: StoredWeekTemplate | undefined }) {
  const navigate = useNavigate();
  const profile = useProfile();
  const [draft, setDraft] = useState<TemplateDraft>(() =>
    existing ? draftFromTemplate(existing) : { name: '', sessions: [] },
  );
  return (
    <TemplateEditor
      draft={draft}
      onChange={setDraft}
      profile={profile.loading ? undefined : profile.value}
      saveLabel={t('common.save')}
      onSave={(template) => {
        void saveTemplate(db, template, existing).then(() =>
          navigate('/templates'),
        );
      }}
    />
  );
}
