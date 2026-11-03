import { describe, expect, it } from 'vitest';
import { uuidv7 } from '../../src/model/id.ts';

describe('uuidv7', () => {
  it('has the v7 layout', () => {
    expect(uuidv7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('encodes the time in the first 48 bits', () => {
    // 1_700_000_000_000 ms = 0x018bcfe56800
    const id = uuidv7(1_700_000_000_000, (b) => {
      b.fill(0);
    });
    expect(id).toBe('018bcfe5-6800-7000-8000-000000000000');
  });

  it('sorts by creation time', () => {
    const a = uuidv7(1_000);
    const b = uuidv7(2_000);
    expect(a < b).toBe(true);
  });
});
