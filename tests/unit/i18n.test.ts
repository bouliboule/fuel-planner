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

describe('i18n placeholders', () => {
  it('fills named values and leaves unknown ones', () => {
    expect(t('form.range', { min: 1.2, max: 1.5 })).toBe(
      'Allowed range: 1.2 to 1.5.',
    );
    expect(t('settings.version', {})).toBe('Version {version}');
  });
});
