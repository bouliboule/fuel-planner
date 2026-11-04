import { sessionEnergy } from '../../engine/energy.ts';
import { formatNumber, t, type MessageKey } from '../../i18n/index.ts';
import type { Profile } from '../../model/index.ts';
import { energyMethodText } from './energyText.ts';
import { sessionFromDraft, type SessionDraft } from './sessionDraft.ts';

/** Live E3/E4 estimate for the session being edited. */
export function KcalPreview({
  draft,
  profile,
}: {
  draft: SessionDraft;
  profile: Profile;
}) {
  const result = sessionFromDraft(draft);
  let body: React.ReactNode = (
    <p className="text-sm text-slate-500 dark:text-slate-400">
      {t('preview.incomplete')}
    </p>
  );
  if (result.ok) {
    const energy = sessionEnergy(
      {
        ...result.session,
        id: 'preview',
        date: '2000-01-01',
      },
      profile,
    );
    const method = energyMethodText(energy);
    body = (
      <>
        <p className="text-2xl font-semibold" data-testid="kcal-preview">
          {t('preview.kcal', { kcal: formatNumber(energy.kcal, 0) })}
        </p>
        {method && <p className="text-sm">{method}</p>}
        {energy.warnings.map((w) => (
          <p
            key={w.code}
            className="mt-1 text-sm text-amber-700 dark:text-amber-400"
          >
            {t(`warning.${w.code}` as MessageKey)}
          </p>
        ))}
      </>
    );
  }
  return (
    <section
      aria-live="polite"
      aria-label={t('preview.title')}
      className="mt-6 rounded-xl bg-slate-100 p-4 dark:bg-slate-900"
    >
      <h2 className="text-sm font-medium">{t('preview.title')}</h2>
      {body}
    </section>
  );
}
