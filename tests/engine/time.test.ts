import { describe, expect, it } from 'vitest';
import { toClock, toMinutes } from '../../src/engine/time.ts';

describe('clock times', () => {
  it('converts HH:mm to minutes of the day', () => {
    // 9 * 60 + 30 = 570
    expect(toMinutes('09:30')).toBe(570);
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('23:59')).toBe(1439);
  });

  it('converts minutes of the day to HH:mm', () => {
    expect(toClock(570)).toBe('09:30');
    expect(toClock(0)).toBe('00:00');
    expect(toClock(1350)).toBe('22:30');
  });
});
