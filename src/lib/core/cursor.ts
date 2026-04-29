import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import { configs, rconfigs } from './configs';
import { gsubtmp } from './paths';
import { UploadFormData } from './types';

const MASTER_CURSOR_SIZE = 256;

const scaleHotspot = (value: number, size: number): number => {
  const scaled = Math.round((value / MASTER_CURSOR_SIZE) * size);
  return Math.max(0, Math.min(size - 1, scaled));
};

export const storeCursors = async (
  buildId: string,
  data: UploadFormData,
): Promise<{ name: string | null; errors: string[] }> => {
  const errors: string[] = [];
  const { name, frames, platform, size, delay, mode } = data;

  if (frames.length === 0) {
    errors.push('Unable to convert SVG to PNG');
    return { name: null, errors };
  }

  const config = mode === 'right'
    ? rconfigs[name] || configs[name]
    : configs[name];

  if (!config) {
    errors.push(`Unable to find Configuration for '${name}'`);
    return { name: null, errors };
  }

  const tmpDir = path.join(gsubtmp(buildId), 'cursors');
  fs.mkdirSync(tmpDir, { recursive: true });

  const hotspotX = config.x != null ? scaleHotspot(config.x, size) : Math.floor(size / 2);
  const hotspotY = config.y != null ? scaleHotspot(config.y, size) : Math.floor(size / 2);

  try {
    if (platform === 'png') {
      if (frames.length === 1) {
        const pngData = await sharp(frames[0]).resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        }).png().toBuffer();
        fs.writeFileSync(path.join(tmpDir, `${name}.png`), pngData);
      } else {
        const maxDigits = String(frames.length).length;
        for (let i = 0; i < frames.length; i++) {
          const index = String(i + 1).padStart(maxDigits, '0');
          const pngData = await sharp(frames[i]).resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          }).png().toBuffer();
          fs.writeFileSync(path.join(tmpDir, `${name}-${index}.png`), pngData);
        }
      }
    }

    if (platform === 'win' && config.winname) {
      if (frames.length === 1) {
        const pngData = await sharp(frames[0]).resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        }).png().toBuffer();
        fs.writeFileSync(path.join(tmpDir, `${config.winname}.cur`), pngData);
      } else {
        const maxDigits = String(frames.length).length;
        for (let i = 0; i < frames.length; i++) {
          const index = String(i + 1).padStart(maxDigits, '0');
          const pngData = await sharp(frames[i]).resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          }).png().toBuffer();
          fs.writeFileSync(path.join(tmpDir, `${config.winname}-${index}.png`), pngData);
        }
      }
    }

    if (platform === 'x11' && config.xname) {
      const cursorName = config.xname;
      if (frames.length === 1) {
        const pngData = await sharp(frames[0]).resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        }).png().toBuffer();
        fs.writeFileSync(path.join(tmpDir, cursorName), pngData);
      } else {
        const maxDigits = String(frames.length).length;
        for (let i = 0; i < frames.length; i++) {
          const index = String(i + 1).padStart(maxDigits, '0');
          const pngData = await sharp(frames[i]).resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          }).png().toBuffer();
          fs.writeFileSync(path.join(tmpDir, `${cursorName}-${index}.png`), pngData);
        }
      }

      if (config.links) {
        const baseFile = frames.length === 1 ? cursorName : `${cursorName}-1.png`;
        for (const link of config.links) {
          try {
            fs.symlinkSync(baseFile, path.join(tmpDir, link));
          } catch {
            fs.copyFileSync(path.join(tmpDir, baseFile), path.join(tmpDir, link));
          }
        }
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    errors.push(`Failed to build '${name}' cursor`);
  }

  return { name, errors };
};
