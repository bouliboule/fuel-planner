import { formatNumber, t } from '../../i18n/index.ts';

const WIDTH = 300;
const HEIGHT = 64;
const PAD = 4;

/** Sparkline of body mass by entry order; dates are in the list below it. */
export function MassTrend({ values }: { values: readonly number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = PAD + (i * (WIDTH - 2 * PAD)) / (values.length - 1);
      const y = PAD + ((max - v) * (HEIGHT - 2 * PAD)) / span;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      role="img"
      aria-label={t('bodyMass.trend', {
        min: formatNumber(min),
        max: formatNumber(max),
      })}
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      className="mt-4 h-16 w-full text-amber-600 dark:text-amber-400"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
