import { en, type MessageKey } from './en.ts';

export type { MessageKey };

export const messages: Readonly<Record<MessageKey, string>> = en;

/** The string for `key`, with `{name}` placeholders filled from `values`. */
export function t(
  key: MessageKey,
  values?: Record<string, string | number>,
): string {
  const text = messages[key];
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** Formats a number for display with at most `digits` decimals. */
export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(
    value,
  );
}
