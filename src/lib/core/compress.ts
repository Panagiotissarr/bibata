import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';

import { gsubtmp, gtmp } from './paths';
import { attachFiles } from './files';
import { DownloadParams, FileResponse, Platform } from './types';

const walkDir = (dir: string): string[] => {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results.push(...walkDir(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
};

const createZip = (sourceDir: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, path.basename(sourceDir));
    archive.finalize();
  });
};

const createTarGz = (sourceDir: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('tar', { gzip: true });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, path.basename(sourceDir));
    archive.finalize();
  });
};

export const winCompress = async (
  buildId: string,
  params: DownloadParams,
): Promise<FileResponse> => {
  const errors: string[] = [];
  const dir = gsubtmp(buildId);
  const name = `${params.name}-${buildId.slice(0, 5)}-v${params.version}-${params.platform}`;
  const fp = path.join(gtmp(buildId), `${name}.zip`);

  if (!fs.existsSync(fp)) {
    if (fs.readdirSync(dir).length <= 0) {
      errors.push('Empty build directory');
    }

    try {
      attachFiles(buildId, dir, params);
      await createZip(dir, fp);
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  return { file: fp, errors };
};

export const pngCompress = async (
  buildId: string,
  params: DownloadParams,
): Promise<FileResponse> => {
  const errors: string[] = [];
  const dir = gsubtmp(buildId);
  const name = `${params.name}-${buildId.slice(0, 5)}-v${params.version}-${params.platform}`;
  const fp = path.join(gtmp(buildId), `${name}.zip`);

  if (!fs.existsSync(fp)) {
    if (fs.readdirSync(dir).length <= 0) {
      errors.push('Empty build directory');
    }

    try {
      attachFiles(buildId, dir, params);
      await createZip(dir, fp);
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  return { file: fp, errors };
};

export const x11Compress = async (
  buildId: string,
  params: DownloadParams,
): Promise<FileResponse> => {
  const errors: string[] = [];
  const dir = gsubtmp(buildId);
  const name = `${params.name}-${buildId.slice(0, 5)}-v${params.version}-${params.platform}`;
  const fp = path.join(gtmp(buildId), `${name}.tar.gz`);

  if (!fs.existsSync(fp)) {
    if (fs.readdirSync(dir).length <= 0) {
      errors.push('Empty build directory');
    }

    try {
      attachFiles(buildId, dir, params);
      await createTarGz(dir, fp);
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  return { file: fp, errors };
};

export const packageCursorBuild = async (
  buildId: string,
  params: DownloadParams,
): Promise<FileResponse> => {
  switch (params.platform) {
    case 'win':
      return winCompress(buildId, params);
    case 'png':
      return pngCompress(buildId, params);
    case 'x11':
    default:
      return x11Compress(buildId, params);
  }
};
