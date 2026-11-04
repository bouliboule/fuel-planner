import type { TraceStep } from '../../engine/trace.ts';
import { formatNumber, t } from '../../i18n/index.ts';

const value = (v: number | string) =>
  typeof v === 'number' ? formatNumber(v, 3) : v;

/** "Why" disclosure: rule ID, formula label, inputs and result per step. */
export function Why({
  steps,
  label,
}: {
  steps: readonly TraceStep[];
  label?: string;
}) {
  if (steps.length === 0) return null;
  return (
    <details className="mt-1 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-amber-700 dark:text-amber-400">
        {label ? `${t('detail.why')}: ${label}` : t('detail.why')}
      </summary>
      <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-900">
        <p className="font-medium">{t('trace.title')}</p>
        <ol className="mt-2 space-y-2">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="font-mono text-xs">{s.ruleId}</span> {s.label} ={' '}
              <strong>{value(s.output)}</strong>
              {Object.keys(s.inputs).length > 0 && (
                <span className="block text-xs text-slate-500">
                  {Object.entries(s.inputs)
                    .map(([k, v]) => `${k} ${value(v)}`)
                    .join(' · ')}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
