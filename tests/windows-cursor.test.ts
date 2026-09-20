import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';

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
  assert.equal(file.readUInt16LE(0), 0);
  assert.equal(file.readUInt16LE(2), 2);
  assert.equal(file.readUInt16LE(4), 1);
  assert.equal(file[6], size === 256 ? 0 : size);
  assert.equal(file[7], size === 256 ? 0 : size);
  assert.equal(file.readUInt16LE(10), Math.max(0, Math.min(size - 1, Math.round(x * size / 256))));
  assert.equal(file.readUInt16LE(12), Math.max(0, Math.min(size - 1, Math.round(y * size / 256))));
  assert.equal(file.readUInt32LE(14), file.length - 22);
  assert.equal(file.readUInt32LE(18), 22);
  const dib = file.subarray(22);
  assert.equal(dib.readUInt32LE(0), 40, 'BITMAPINFOHEADER, not an embedded PNG');
  assert.equal(dib.readInt32LE(4), size);
  assert.equal(dib.readInt32LE(8), size * 2, 'height includes XOR bitmap and AND mask');
  assert.equal(dib.readUInt16LE(12), 1);
  assert.equal(dib.readUInt16LE(14), 32);
  assert.equal(dib.readUInt32LE(16), 0, 'uncompressed BI_RGB');
  const maskStride = Math.ceil(size / 32) * 4;
  assert.equal(dib.length, 40 + size * size * 4 + maskStride * size);
  return { pixels: dib.subarray(40, 40 + size * size * 4), mask: dib.subarray(40 + size * size * 4) };
};

const solidPng = (r: number, g: number, b: number) => sharp({
  create: { width: 4, height: 4, channels: 4, background: { r, g, b, alpha: 1 } }
}).png().toBuffer();

test('CUR uses bottom-up BGRA pixels and a DWORD-aligned transparency mask', async () => {
  const png = await sharp(Buffer.from([
    255, 0, 0, 255, 0, 255, 0, 0,
    0, 0, 255, 128, 255, 255, 255, 255
  ]), { raw: { width: 2, height: 2, channels: 4 } }).png().toBuffer();
  const { pixels, mask } = parseCur(await createCurFile(png, 2, 0, 0), 2, 0, 0);
  assert.deepEqual(Array.from(pixels), [
    255, 0, 0, 128, 255, 255, 255, 255,
    0, 0, 255, 255, 0, 255, 0, 0
  ]);
  assert.deepEqual(Array.from(mask), [0, 0, 0, 0, 0x40, 0, 0, 0]);
});

test('CUR scales independent X/Y hotspots at every supported size', async () => {
  const png = await solidPng(32, 160, 218);
  for (const size of [16, 20, 22, 24, 28, 32, 40, 48, 56, 64, 72, 80, 88, 96, 256]) {
    for (const [x, y] of [[55, 17], [197, 24], [128, 128], [-10, 300]]) {
      parseCur(await createCurFile(png, size, x, y), size, x, y);
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
      const { frames } = parseAni(await createAniFile(source, 32, 128, 128, 30));
      assert.equal(frames.length, source.length);
      for (const frame of frames) parseCur(frame, 32, 128, 128);
      assert.ok(new Set(frames.map((frame) => frame.toString('base64'))).size > 1, 'animation must not repeat one static frame');
      assert.deepEqual(frames[0], await createCurFile(source[0], 32, 128, 128));
      assert.deepEqual(frames[frames.length - 1], await createCurFile(source[source.length - 1], 32, 128, 128));
    });
  }
}
