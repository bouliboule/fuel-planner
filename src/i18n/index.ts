import { en, type MessageKey } from './en.ts';

export type { MessageKey };

export const messages: Readonly<Record<MessageKey, string>> = en;

export function t(key: MessageKey): string {
  return messages[key];
}
