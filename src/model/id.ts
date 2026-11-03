// UUID v7: 48-bit Unix time in ms, then random bits, so ids sort by creation
// time. `now` and `random` are injectable for tests.

export function uuidv7(
  now: number = Date.now(),
  random: (bytes: Uint8Array<ArrayBuffer>) => void = (b) => {
    crypto.getRandomValues(b);
  },
): string {
  const bytes = new Uint8Array(16);
  random(bytes);
  let time = Math.floor(now);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70; // version 7
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(
    '',
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
