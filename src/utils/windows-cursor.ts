import sharp from 'sharp';

const MASTER_CURSOR_SIZE = 256;

// Windows loads cursors at system-defined canvas sizes. Keep the requested
// artwork size inside the next standard canvas rather than letting Windows
// stretch a small image to fill it. This mirrors clickgen's re_canvas policy:
// https://github.com/ful1e5/clickgen/blob/main/src/clickgen/writer/windows.py
const WINDOWS_CANVAS_SIZES = [32, 48, 64, 96, 128, 256];

const scaleHotspot = (value: number, size: number): number =>
  Math.max(0, Math.min(size - 1, Math.round(value * size / MASTER_CURSOR_SIZE)));

export const createCurFile = async (frame: Buffer, size: number, x: number, y: number): Promise<Buffer> => {
  if (!Number.isInteger(size) || size < 1 || size > 256) {
    throw new RangeError('Windows cursor size must be an integer between 1 and 256.');
  }
  const canvasSize = WINDOWS_CANVAS_SIZES.find((value) => value >= size)!;

  // ANI frames need the classic DIB form of CUR rather than PNG-compressed
  // images. Use the same encoder for standalone cursors for compatibility.
  const rgba = await sharp(frame).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).toColourspace('srgb').ensureAlpha().extend({
    // Pad on the right/bottom only, just like clickgen. Centering would move
    // the artwork and require shifting its hotspot; resizing would enlarge it.
    top: 0,
    left: 0,
    right: canvasSize - size,
    bottom: canvasSize - size,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).raw().toBuffer();

  const pixels = Buffer.alloc(canvasSize * canvasSize * 4);
  // The 1-bit AND mask has scanlines padded to a multiple of four bytes.
  const maskStride = Math.ceil(canvasSize / 32) * 4;
  const mask = Buffer.alloc(maskStride * canvasSize);

  for (let row = 0; row < canvasSize; row++) {
    for (let col = 0; col < canvasSize; col++) {
      const source = (row * canvasSize + col) * 4;
      const bottomUpRow = canvasSize - 1 - row;
      const target = (bottomUpRow * canvasSize + col) * 4;
      // DIB scanlines run bottom-up and store BGRA, not RGBA. Keep alpha
      // intact so antialiased edges render correctly on any background.
      pixels[target] = rgba[source + 2];
      pixels[target + 1] = rgba[source + 1];
      pixels[target + 2] = rgba[source];
      pixels[target + 3] = rgba[source + 3];
      if (rgba[source + 3] === 0) {
        mask[bottomUpRow * maskStride + (col >> 3)] |= 0x80 >> (col % 8);
      }
    }
  }

  const bitmapHeader = Buffer.alloc(40); // BITMAPINFOHEADER
  bitmapHeader.writeUInt32LE(40, 0);
  bitmapHeader.writeInt32LE(canvasSize, 4);
  bitmapHeader.writeInt32LE(canvasSize * 2, 8); // XOR bitmap + AND mask
  bitmapHeader.writeUInt16LE(1, 12); // planes
  bitmapHeader.writeUInt16LE(32, 14); // bits per pixel, BI_RGB (uncompressed)
  bitmapHeader.writeUInt32LE(pixels.length + mask.length, 20);
  const image = Buffer.concat([bitmapHeader, pixels, mask]);

  const header = Buffer.alloc(6);
  header.writeUInt16LE(2, 2); // CUR, not ICO
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(canvasSize === 256 ? 0 : canvasSize, 0);
  entry.writeUInt8(canvasSize === 256 ? 0 : canvasSize, 1);
  // These are separate WORDs at offsets 4 and 6. Config hotspots refer to
  // the original 256px artwork, so scale them to the artwork, NOT the canvas.
  entry.writeUInt16LE(scaleHotspot(x, size), 4);
  entry.writeUInt16LE(scaleHotspot(y, size), 6);
  entry.writeUInt32LE(image.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, image]);
};

const riffPad = (buf: Buffer): Buffer => {
  if (buf.length % 2 !== 0) {
    return Buffer.concat([buf, Buffer.alloc(1)]);
  }
  return buf;
};

const writeChunk = (id: string, data: Buffer): Buffer => {
  const header = Buffer.alloc(8);
  header.write(id.slice(0, 4).padEnd(4, ' '), 0, 'ascii');
  header.writeUInt32LE(data.length, 4);
  return Buffer.concat([header, riffPad(data)]);
};

const writeList = (type: string, content: Buffer): Buffer => {
  const typeBuf = Buffer.alloc(4);
  typeBuf.write(type.slice(0, 4).padEnd(4, ' '), 0, 'ascii');
  const inner = Buffer.concat([typeBuf, riffPad(content)]);
  return writeChunk('LIST', inner);
};

export const createAniFile = async (frames: Buffer[], size: number, x: number, y: number, delay: number): Promise<Buffer> => {
  const curFiles = await Promise.all(frames.map((f) => createCurFile(f, size, x, y)));

  const jiffies = Math.max(1, Math.round(delay * 60 / 1000));

  const rateTable = Buffer.alloc(4 * frames.length);
  for (let i = 0; i < frames.length; i++) {
    rateTable.writeUInt32LE(jiffies, i * 4);
  }

  const anihHeader = Buffer.alloc(36);
  anihHeader.writeUInt32LE(36, 0);
  anihHeader.writeUInt32LE(frames.length, 4);
  anihHeader.writeUInt32LE(frames.length, 8);
  // AF_ICON frames carry their own dimensions, bit depth and planes in
  // their CUR/DIB headers; leave these ANI fields zero.
  anihHeader.writeUInt32LE(0, 12);
  anihHeader.writeUInt32LE(0, 16);
  anihHeader.writeUInt32LE(0, 20);
  anihHeader.writeUInt32LE(0, 24);
  anihHeader.writeUInt32LE(jiffies, 28);
  anihHeader.writeUInt32LE(0x00000001, 32);

  const framParts: Buffer[] = [];
  for (const cur of curFiles) {
    framParts.push(writeChunk('icon', cur));
  }
  const framList = writeList('fram', Buffer.concat(framParts));

  const anihChunk = writeChunk('anih', anihHeader);
  const rateChunk = writeChunk('rate', rateTable);

  const inamData = Buffer.concat([Buffer.from('Bibata Cursor', 'utf8'), Buffer.alloc(1)]);
  const inamChunk = writeChunk('INAM', inamData);
  const infoList = writeList('INFO', inamChunk);

  const riffType = Buffer.alloc(4);
  riffType.write('ACON', 0, 'ascii');

  const content = Buffer.concat([
    riffType,
    infoList,
    anihChunk,
    rateChunk,
    framList,
  ]);

  const riffHeader = Buffer.alloc(8);
  riffHeader.write('RIFF', 0, 'ascii');
  riffHeader.writeUInt32LE(content.length, 4);

  return Buffer.concat([riffHeader, riffPad(content)]);
};
