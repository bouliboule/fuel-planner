import type { Warning } from '../../engine/trace.ts';
import { formatNumber, t, type MessageKey } from '../../i18n/index.ts';

export function WarningText({ warning }: { warning: Warning }) {
  const values = Object.fromEntries(
    Object.entries(warning.values ?? {}).map(([k, v]) => [
      k,
      typeof v === 'number' ? formatNumber(v, 1) : v,
    ]),
  );
  return (
    <p role="note" className="mt-1 text-sm font-bold text-warn-ink">
      {t(`warning.${warning.code}` as MessageKey, values)}
    </p>
  );
}
