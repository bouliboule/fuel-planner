import { Link } from 'react-router';
import {
  db,
  deleteTemplate,
  duplicateTemplate,
  listTemplates,
  useLiveQuery,
} from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';

export function TemplatesScreen() {
  const templates = useLiveQuery(() => listTemplates(db), []);
  return (
    <Screen title={t('templates.title')}>
      <BackLink to="/week" />
      <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
        {!templates.loading &&
          templates.value.map((tpl) => (
            <li
              key={tpl.id}
              className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2"
            >
              <span>{tpl.name}</span>
              <span className="flex gap-2">
                <Link
                  to={`/templates/${tpl.id}`}
                  className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 font-medium dark:border-slate-700"
                >
                  {t('templates.edit')}
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void duplicateTemplate(
                      db,
                      tpl.id,
                      t('templates.copyOf', { name: tpl.name }),
                    );
                  }}
                >
                  {t('templates.duplicate')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void deleteTemplate(db, tpl.id);
                  }}
                >
                  {t('templates.delete')}
                </Button>
              </span>
            </li>
          ))}
      </ul>
      <p className="mt-4">
        <Link
          to="/templates/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-amber-600 px-4 font-medium text-white"
        >
          {t('templates.new')}
        </Link>
      </p>
    </Screen>
  );
}
