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
    <p className="text-sm text-ink-muted">{t('preview.incomplete')}</p>
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
        <p className="text-2xl font-black" data-testid="kcal-preview">
          {t('preview.kcal', { kcal: formatNumber(energy.kcal, 0) })}
        </p>
        {method && <p className="text-sm">{method}</p>}
        {energy.warnings.map((w) => (
          <p key={w.code} className="mt-1 text-sm font-bold text-warn-ink">
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
      className="brutal mt-6 bg-sunken p-4"
    >
      <h2 className="text-sm font-black uppercase">{t('preview.title')}</h2>
      {body}
    </section>
  );
}
