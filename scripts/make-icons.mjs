// Writes the placeholder app icons into public/ as PNG files, using only
// Node built-ins. Run with `pnpm icons` after changing the design below.
//
// Design: a plate (amber ring) on the theme background, full bleed. The ring
// stays inside the maskable safe zone (a circle of radius 0.4 of the size).

import { writeFile } from 'node:fs/promises';
import { crc32, deflateSync } from 'node:zlib';

const background = [15, 23, 42]; // #0f172a, theme colour
const ring = [245, 158, 11]; // #f59e0b
const outerRadius = 0.34;
const innerRadius = 0.24;
const samplesPerAxis = 4; // supersampling for anti-aliased edges

function colourAt(x, y) {
  const d = Math.hypot(x - 0.5, y - 0.5);
  return d <= outerRadius && d >= innerRadius ? ring : background;
}

function render(size) {
  const rowLength = 1 + size * 3; // filter byte, then RGB
  const raw = Buffer.alloc(rowLength * size);
  const n = samplesPerAxis;
  for (let py = 0; py < size; py++) {
    raw[py * rowLength] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < n; sy++) {
        for (let sx = 0; sx < n; sx++) {
          const c = colourAt(
            (px + (sx + 0.5) / n) / size,
            (py + (sy + 0.5) / n) / size,
          );
          sum[0] += c[0];
          sum[1] += c[1];
          sum[2] += c[2];
        }
      }
      const offset = py * rowLength + 1 + px * 3;
      for (let i = 0; i < 3; i++)
        raw[offset + i] = Math.round(sum[i] / (n * n));
    }
  }
  return raw;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB, no alpha (iOS fills transparency with black)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(render(size))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const midRadius = (outerRadius + innerRadius) / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="${hex(background)}"/>
  <circle cx="50" cy="50" r="${String(midRadius * 100)}" fill="none" stroke="${hex(ring)}" stroke-width="${String((outerRadius - innerRadius) * 100)}"/>
</svg>
`;

const outputs = [
  ['public/pwa-192.png', png(192)],
  ['public/pwa-512.png', png(512)],
  ['public/pwa-maskable-512.png', png(512)],
  ['public/apple-touch-icon.png', png(180)],
  ['public/favicon.svg', svg],
];

for (const [path, data] of outputs) {
  await writeFile(path, data);
  console.log(`wrote ${path}`);
}
