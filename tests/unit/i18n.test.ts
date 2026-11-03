import { describe, expect, it } from 'vitest';
import { messages, t, type MessageKey } from '../../src/i18n/index.ts';

describe('i18n', () => {
  it('has a non-empty string for every key', () => {
    for (const [key, value] of Object.entries(messages)) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('resolves a key to its English string', () => {
    const key: MessageKey = 'tab.today';
    expect(t(key)).toBe('Today');
  });
});
