import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { inflateRawSync } from 'node:zlib';
import { NextRequest } from 'next/server';
import sharp from 'sharp';

import { POST } from '../src/app/api/core/build/route';
import { createAniFile, createCurFile } from '../src/utils/windows-cursor';

// Parse the file independently of the writer, including RIFF padding/bounds.
const chunks = (data: Buffer) => {
  const result: { id: string; data: Buffer }[] = [];
  let offset = 0;
  while (offset < data.length) {
    assert.ok(offset + 8 <= data.length, 'complete chunk header');
    const size = data.readUInt32LE(offset + 4);
    const end = offset + 8 + size;
    assert.ok(end <= data.length, 'chunk stays inside parent');
    result.push({ id: data.toString('ascii', offset, offset + 4), data: data.subarray(offset + 8, end) });
    if (size % 2) assert.equal(data[end], 0, 'word-aligned padding');
    offset = end + (size % 2);
  }
  assert.equal(offset, data.length);
  return result;
};

const parseAni = (file: Buffer) => {
  assert.equal(file.toString('ascii', 0, 4), 'RIFF');
  assert.equal(file.readUInt32LE(4), file.length - 8);
  assert.equal(file.toString('ascii', 8, 12), 'ACON');
  const top = chunks(file.subarray(12));
  const header = top.find((chunk) => chunk.id === 'anih')!.data;
  const rates = top.find((chunk) => chunk.id === 'rate')!.data;
  const list = top.find((chunk) => chunk.id === 'LIST' && chunk.data.toString('ascii', 0, 4) === 'fram')!.data;
  const icons = chunks(list.subarray(4));
  assert.ok(icons.every((chunk) => chunk.id === 'icon'));
  assert.equal(header.length, 36);
  assert.equal(header.readUInt32LE(0), 36);
  assert.equal(header.readUInt32LE(4), icons.length);
  assert.equal(header.readUInt32LE(8), icons.length);
  // AF_ICON: each frame is a CUR file, with its dimensions in the CUR/DIB.
  assert.equal(header.readUInt32LE(12), 0);
  assert.equal(header.readUInt32LE(16), 0);
  assert.equal(header.readUInt32LE(20), 0);
  assert.equal(header.readUInt32LE(24), 0);
  assert.equal(header.readUInt32LE(32), 1);
  assert.equal(rates.length, icons.length * 4);
  for (let i = 0; i < icons.length; i++) {
    assert.equal(rates.readUInt32LE(i * 4), header.readUInt32LE(28));
    assert.ok(rates.readUInt32LE(i * 4) >= 1);
  }
  return { header, frames: icons.map((chunk) => chunk.data) };
};

const parseCur = (file: Buffer, size: number, x: number, y: number) => {
  const canvasSize = [32, 48, 64, 96, 128, 256].find((value) => value >= size)!;
  assert.equal(file.readUInt16LE(0), 0);
  assert.equal(file.readUInt16LE(2), 2);
  assert.equal(file.readUInt16LE(4), 1);
  assert.equal(file[6], canvasSize === 256 ? 0 : canvasSize);
  assert.equal(file[7], canvasSize === 256 ? 0 : canvasSize);
  assert.equal(file.readUInt16LE(10), Math.max(0, Math.min(size - 1, Math.round(x * size / 256))));
  assert.equal(file.readUInt16LE(12), Math.max(0, Math.min(size - 1, Math.round(y * size / 256))));
  assert.equal(file.readUInt32LE(14), file.length - 22);
  assert.equal(file.readUInt32LE(18), 22);
  const dib = file.subarray(22);
  assert.equal(dib.readUInt32LE(0), 40, 'BITMAPINFOHEADER, not an embedded PNG');
  assert.equal(dib.readInt32LE(4), canvasSize);
  assert.equal(dib.readInt32LE(8), canvasSize * 2, 'height includes XOR bitmap and AND mask');
  assert.equal(dib.readUInt16LE(12), 1);
  assert.equal(dib.readUInt16LE(14), 32);
  assert.equal(dib.readUInt32LE(16), 0, 'uncompressed BI_RGB');
  const maskStride = Math.ceil(canvasSize / 32) * 4;
  assert.equal(dib.length, 40 + canvasSize * canvasSize * 4 + maskStride * canvasSize);
  return { canvasSize, pixels: dib.subarray(40, 40 + canvasSize * canvasSize * 4), mask: dib.subarray(40 + canvasSize * canvasSize * 4) };
};

// Read sizes from the ZIP central directory: archiver streams data descriptors.
const zipEntries = (file: Buffer) => {
  const end = file.length - 22;
  assert.equal(file.readUInt32LE(end), 0x06054b50);
  assert.equal(file.readUInt16LE(end + 20), 0, 'no ZIP comment');
  const entries = new Map<string, Buffer>();
  let offset = file.readUInt32LE(end + 16);
  for (let i = 0; i < file.readUInt16LE(end + 10); i++) {
    assert.equal(file.readUInt32LE(offset), 0x02014b50);
    const method = file.readUInt16LE(offset + 10);
    const compressedSize = file.readUInt32LE(offset + 20);
    const nameLength = file.readUInt16LE(offset + 28);
    const name = file.toString('utf8', offset + 46, offset + 46 + nameLength);
    const localOffset = file.readUInt32LE(offset + 42);
    assert.equal(file.readUInt32LE(localOffset), 0x04034b50);
    const start = localOffset + 30 + file.readUInt16LE(localOffset + 26) + file.readUInt16LE(localOffset + 28);
    const compressed = file.subarray(start, start + compressedSize);
    assert.ok(method === 0 || method === 8, 'stored or deflated ZIP entry');
    const data = method === 8 ? inflateRawSync(compressed) : compressed;
    assert.equal(data.length, file.readUInt32LE(offset + 24));
    entries.set(name, data);
    offset += 46 + nameLength + file.readUInt16LE(offset + 30) + file.readUInt16LE(offset + 32);
  }
  assert.equal(offset, end);
  return entries;
};

const solidPng = (r: number, g: number, b: number) => sharp({
  create: { width: 4, height: 4, channels: 4, background: { r, g, b, alpha: 1 } }
}).png().toBuffer();

test('CUR uses bottom-up BGRA pixels and a DWORD-aligned transparency mask', async () => {
  const png = await sharp(Buffer.from([
    255, 0, 0, 255, 0, 255, 0, 0,
    0, 0, 255, 128, 255, 255, 255, 255
  ]), { raw: { width: 2, height: 2, channels: 4 } }).png().toBuffer();
  const { pixels, mask, canvasSize } = parseCur(await createCurFile(png, 2, 0, 0), 2, 0, 0);
  const pixelAt = (x: number, y: number) => {
    const offset = ((canvasSize - 1 - y) * canvasSize + x) * 4;
    return Array.from(pixels.subarray(offset, offset + 4));
  };
  assert.deepEqual(pixelAt(0, 0), [0, 0, 255, 255]);
  assert.deepEqual(pixelAt(1, 0), [0, 255, 0, 0]);
  assert.deepEqual(pixelAt(0, 1), [255, 0, 0, 128]);
  assert.deepEqual(pixelAt(1, 1), [255, 255, 255, 255]);
  assert.deepEqual(pixelAt(2, 0), [0, 0, 0, 0]);
  assert.deepEqual(pixelAt(0, 2), [0, 0, 0, 0]);
  assert.equal(mask[(canvasSize - 1) * 4], 0x7f); // Top row: opaque, then transparent.
  assert.equal(mask[(canvasSize - 2) * 4], 0x3f); // Partial alpha must not set the mask.
  assert.equal(mask[0], 0xff); // Bottom row is transparent padding.
});

test('CUR scales independent X/Y hotspots at every supported size', async () => {
  const png = await solidPng(32, 160, 218);
  for (const size of [16, 20, 22, 24, 28, 32, 40, 48, 56, 64, 72, 80, 88, 96, 128, 256]) {
    for (const [x, y] of [[55, 17], [197, 24], [128, 128], [-10, 300]]) {
      parseCur(await createCurFile(png, size, x, y), size, x, y);
    }
  }
});

test('missing hotspots default to the source center before scaling CUR and every ANI frame', async () => {
  const source = [await solidPng(255, 0, 0), await solidPng(0, 255, 0)];
  const cases = [
    [1, 0], [16, 8], [22, 11], [24, 12], [28, 14], [32, 16], [33, 17],
    [40, 20], [56, 28], [64, 32], [80, 40], [128, 64], [256, 128],
  ];
  for (const [size, expected] of cases) {
    const { frames } = parseAni(await createAniFile(source, size, undefined, undefined, 30));
    assert.equal(frames.length, source.length);
    for (let i = 0; i < frames.length; i++) {
      parseCur(frames[i], size, 128, 128);
      assert.equal(frames[i].readUInt16LE(10), expected);
      assert.equal(frames[i].readUInt16LE(12), expected);
      assert.deepEqual(frames[i], await createCurFile(source[i], size));
    }
  }
});

test('hotspot defaults are per-axis and preserve explicit overrides, including zero', async () => {
  const source = [await solidPng(255, 0, 0), await solidPng(0, 255, 0)];
  const cases = [
    [0, undefined, 0, 12], [undefined, 0, 12, 0],
    [55, undefined, 5, 12], [undefined, 17, 12, 2],
    [0, 0, 0, 0], [55, 17, 5, 2], [197, 24, 18, 2],
    [207, 24, 19, 2], [46, 211, 4, 20],
  ] as const;
  for (const [x, y, expectedX, expectedY] of cases) {
    const { frames } = parseAni(await createAniFile(source, 24, x, y, 30));
    for (let i = 0; i < frames.length; i++) {
      assert.equal(frames[i].readUInt16LE(10), expectedX);
      assert.equal(frames[i].readUInt16LE(12), expectedY);
      assert.deepEqual(frames[i], await createCurFile(source[i], 24, x, y));
    }
  }
});

test('ANI preserves distinct frames in order, frame counts and 60 Hz timing', async () => {
  const source = await Promise.all([solidPng(255, 0, 0), solidPng(0, 255, 0), solidPng(0, 0, 255)]);
  const { header, frames } = parseAni(await createAniFile(source, 32, 55, 17, 30));
  assert.equal(frames.length, 3);
  assert.equal(header.readUInt32LE(28), 2);
  for (let i = 0; i < source.length; i++) {
    parseCur(frames[i], 32, 55, 17);
    assert.deepEqual(frames[i], await createCurFile(source[i], 32, 55, 17));
  }
  assert.equal(new Set(frames.map((frame) => frame.toString('base64'))).size, 3);
});

test('ANI delays never round down to zero ticks', async () => {
  const source = [await solidPng(255, 0, 0), await solidPng(0, 255, 0)];
  const { header } = parseAni(await createAniFile(source, 16, 128, 128, 1));
  assert.equal(header.readUInt32LE(28), 1);
});

for (const type of ['modern', 'modern-right', 'original', 'original-right']) {
  for (const name of ['wait', 'left_ptr_watch']) {
    test(`${type}/${name}: all bundled animation frames survive encoding`, async () => {
      const pointerFile = path.resolve('public/bibata-cursor-svg', type, name);
      const sourceDir = path.resolve(path.dirname(pointerFile), (await readFile(pointerFile, 'utf8')).trim());
      const names = (await readdir(sourceDir)).filter((file) => file.endsWith('.svg')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      assert.equal(names.length, 54);
      const source = await Promise.all(names.map((file) => readFile(path.join(sourceDir, file))));
      const { frames } = parseAni(await createAniFile(source, 24, 128, 128, 30));
      assert.equal(frames.length, source.length);
      for (const frame of frames) parseCur(frame, 24, 128, 128);
      assert.ok(new Set(frames.map((frame) => frame.toString('base64'))).size > 1, 'animation must not repeat one static frame');
      assert.deepEqual(frames[0], await createCurFile(source[0], 24, 128, 128));
      assert.deepEqual(frames[frames.length - 1], await createCurFile(source[source.length - 1], 24, 128, 128));
    });
  }
}


test('small artwork is padded, never enlarged to fill the Windows canvas', async () => {
  const png = await solidPng(12, 34, 56);
  const cases = [
    [16, 32], [20, 32], [22, 32], [24, 32], [28, 32], [32, 32],
    [33, 48], [40, 48], [48, 48], [49, 64], [56, 64], [64, 64],
    [65, 96], [72, 96], [80, 96], [88, 96], [96, 96],
    [97, 128], [128, 128], [129, 256], [256, 256],
  ];
  for (const [size, expectedCanvasSize] of cases) {
    const { pixels, mask, canvasSize } = parseCur(await createCurFile(png, size, 55, 17), size, 55, 17);
    assert.equal(canvasSize, expectedCanvasSize);
    const maskStride = Math.ceil(canvasSize / 32) * 4;
    for (let y = 0; y < canvasSize; y++) {
      for (let x = 0; x < canvasSize; x++) {
        const row = canvasSize - 1 - y;
        const offset = (row * canvasSize + x) * 4;
        const inArtwork = x < size && y < size;
        assert.equal(pixels[offset + 3], inArtwork ? 255 : 0);
        assert.equal(Boolean(mask[row * maskStride + (x >> 3)] & (0x80 >> (x % 8))), !inArtwork);
        if (inArtwork) {
          assert.deepEqual(Array.from(pixels.subarray(offset, offset + 3)), [56, 34, 12]);
        }
      }
    }
  }
});

test('static and animated cursors use identical padding and artwork-scaled hotspots', async () => {
  const source = [await solidPng(255, 0, 0), await solidPng(0, 255, 0)];
  for (const size of [16, 22, 24, 28, 40, 56, 80]) {
    const { frames } = parseAni(await createAniFile(source, size, 197, 24, 30));
    for (let i = 0; i < frames.length; i++) {
      parseCur(frames[i], size, 197, 24);
      assert.deepEqual(frames[i], await createCurFile(source[i], size, 197, 24));
    }
  }
});

for (const mode of ['left', 'right'] as const) {
  for (const frameCount of [1, 2]) {
    const ext = frameCount === 1 ? 'cur' : 'ani';
    test(`${mode}-handed Windows ZIP: ${ext} hotspots use centered defaults and explicit overrides`, async () => {
      const source = (await Promise.all([solidPng(255, 0, 0), solidPng(0, 255, 0)])).slice(0, frameCount);
      const cursors = [
        ...[
          ['crosshair', 'Cross'], ['move', 'Move'], ['xterm', 'Text'],
          ['sb_h_double_arrow', 'Horz'], ['sb_v_double_arrow', 'Vert'],
          ['bd_double_arrow', 'Dgn1'], ['fd_double_arrow', 'Dgn2'],
        ].map(([name, winname]) => ({ name, winname, x: 128, y: 128 })),
        { name: 'left_ptr', winname: 'Pointer', x: mode === 'right' ? 207 : 55, y: mode === 'right' ? 24 : 17 },
        { name: 'left_ptr_watch', winname: 'Work', x: mode === 'right' ? 197 : 55, y: mode === 'right' ? 24 : 17 },
        { name: 'right_ptr', winname: 'Alternate', x: mode === 'right' ? 55 : 204, y: 17 },
        { name: 'pencil', winname: 'Handwriting', x: 46, y: 211 },
        { name: 'hand2', winname: 'Link', x: 114, y: 18 },
      ];
      // 24px artwork has a 32px canvas: centered hotspots must be 12, not 16.
      for (const size of [24, 64]) {
        const response = await POST(new NextRequest('https://bibata.test/api/core/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cursors: cursors.map(({ name }) => ({ name, frames: source.map((frame) => frame.toString('base64')) })),
            platform: 'win', size, delay: 30, mode, name: 'Hotspot regression', version: '1.0',
          }),
        }));
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('Content-Type'), 'application/zip');
        const entries = zipEntries(Buffer.from(await response.arrayBuffer()));
        for (const { winname, x, y } of cursors) {
          const file = entries.get(`Cursors/${winname}.${ext}`);
          assert.ok(file, `${winname}.${ext} is included`);
          const frames = frameCount === 1 ? [file] : parseAni(file).frames;
          assert.equal(frames.length, frameCount);
          for (const frame of frames) parseCur(frame, size, x, y);
        }
      }
    });
  }
}

test('invalid Windows sizes fail before allocating a canvas', async () => {
  const png = await solidPng(0, 0, 0);
  for (const size of [0, -1, 24.5, 257, NaN, Infinity]) {
    await assert.rejects(createCurFile(png, size, 0, 0), RangeError);
  }
});
