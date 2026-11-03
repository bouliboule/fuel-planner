import { describe, expect, it } from 'vitest';
import {
  classifyDayLoad,
  sessionIntensityBand,
  zoneForIf,
} from '../../src/engine/load.ts';
import { noFtpProfile, session, testProfile } from './fixtures.ts';

describe('E3 IF to zone', () => {
  it.each([
    [0.4, 'Z1'],
    [0.5, 'Z1'],
    [0.7, 'Z2'],
    [0.83, 'Z3'],
    [0.89, 'Z3'],
    [0.9, 'SS'],
    [1.0, 'Z4'],
    [1.2, 'Z5'],
  ] as const)('maps IF %d to %s', (value, zone) => {
    expect(zoneForIf(value)).toBe(zone);
  });
});

describe('M2 session intensity band', () => {
  const band = (s: Parameters<typeof sessionIntensityBand>[0], kcal = 0) =>
    sessionIntensityBand(s, testProfile, kcal);

  it.each([
    ['Z1', 'low'],
    ['Z2', 'moderate'],
    ['Z3', 'moderate'],
    ['SS', 'high'],
    ['Z4', 'high'],
    ['Z5', 'high'],
  ] as const)('zone %s is %s', (zone, expected) => {
    expect(
      band(
        session({
          sport: 'ride',
          durationMin: 60,
          intensity: { kind: 'zone', zone },
        }),
      ),
    ).toBe(expected);
  });

  it.each([
    [3, 'low'],
    [3.5, 'low'],
    [4, 'moderate'],
    [6.5, 'moderate'],
    [7, 'high'],
  ] as const)('RPE %d is %s', (value, expected) => {
    expect(
      band(
        session({
          sport: 'pilates',
          durationMin: 60,
          intensity: { kind: 'rpe', value },
        }),
      ),
    ).toBe(expected);
  });

  it.each([
    [2.8, 'low'],
    [3, 'moderate'],
    [5.9, 'moderate'],
    [6, 'high'],
  ] as const)('MET %d is %s', (value, expected) => {
    expect(
      band(
        session({
          sport: 'other',
          durationMin: 60,
          intensity: { kind: 'met', value },
        }),
      ),
    ).toBe(expected);
  });

  it('maps IF through its zone', () => {
    // 0.85 -> Z3 -> moderate
    expect(
      band(
        session({
          sport: 'ride',
          durationMin: 60,
          intensity: { kind: 'if', value: 0.85 },
        }),
      ),
    ).toBe('moderate');
  });

  it('maps kJ through IF when FTP is known', () => {
    // 900 kJ in 1 h = 250 W; 250 / 250 = IF 1.0 -> Z4 -> high
    expect(
      band(
        session({
          sport: 'ride',
          durationMin: 60,
          intensity: { kind: 'kj', value: 900 },
        }),
      ),
    ).toBe('high');
  });

  it('maps kJ through the MET equivalent without FTP', () => {
    // 300 kcal / (75 kg * 1 h) + 1 = 5 MET -> moderate
    expect(
      sessionIntensityBand(
        session({
          sport: 'ride',
          durationMin: 60,
          intensity: { kind: 'kj', value: 300 },
        }),
        noFtpProfile,
        300,
      ),
    ).toBe('moderate');
  });

  it('rates runs at 4 mph or faster as high', () => {
    // 4 mph = 6.437376 km/h -> 3600 / 6.437376 = 559.24 s/km.
    // 559 s/km = 6.44 km/h -> 12028, 6.5 MET -> high
    // 600 s/km = 6.0 km/h -> 12026, 3.3 MET -> moderate
    const run = (secPerKm: number) =>
      band(
        session({
          sport: 'run',
          durationMin: 30,
          intensity: { kind: 'pace', secPerKm },
        }),
      );
    expect(run(300)).toBe('high');
    expect(run(559)).toBe('high');
    expect(run(600)).toBe('moderate');
  });
});

describe('M2 day load', () => {
  it('is rest without sessions', () => {
    expect(classifyDayLoad([]).load).toBe('rest');
  });

  it.each([
    [59, 'high', 'light'],
    [60, 'high', 'moderate'],
    [89, 'moderate', 'moderate'],
    [90, 'moderate', 'high'],
    [239, 'moderate', 'high'],
    [240, 'moderate', 'very-high'],
    [240, 'low', 'light'],
  ] as const)('%d min with a %s session is %s', (durationMin, band, load) => {
    expect(classifyDayLoad([{ durationMin, band }]).load).toBe(load);
  });

  it('sums minutes and takes the highest band', () => {
    // 15 low + 50 moderate = 65 min, highest moderate -> moderate
    const r = classifyDayLoad([
      { durationMin: 15, band: 'low' },
      { durationMin: 50, band: 'moderate' },
    ]);
    expect(r.totalMin).toBe(65);
    expect(r.highestBand).toBe('moderate');
    expect(r.load).toBe('moderate');
  });
});
