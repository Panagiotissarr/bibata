import 'server-only';

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { Platform } from '@prisma/client';

import {
  storeCursors,
  packageCursorBuild as compressPackage,
  gtmp,
} from '@lib/core';
import type { UploadFormData, DownloadParams } from '@lib/core/types';

const BUILD_ROOT = path.join(os.tmpdir(), 'bibata-builds');

export const CORE_SESSION_COOKIE = 'cbuid';
export const HOSTED_PACKAGING_ERROR =
  'This Vercel deployment is an unofficial, modded Bibata preview. Cursor packaging is only available in local or self-hosted builds.';

export const isHostedPackagingDisabled = () => false;

export type CursorBuildPayload = {
  name: string;
  frames: string[];
  platform: Platform;
  size: number;
  delay: number;
  mode: 'left' | 'right';
};

const dataUrlToBytes = (value: string): Buffer => {
  if (value.includes(',')) {
    const [, encoded] = value.split(',', 2);
    return Buffer.from(encoded, 'base64');
  }
  return Buffer.from(value, 'base64');
};

export const createBuildSessionId = () => crypto.randomUUID();

export const destroyBuildArtifacts = async (buildId: string) => {
  await fs.rm(path.join(BUILD_ROOT, buildId), { recursive: true, force: true });
};

export const uploadCursorFrames = async (
  buildId: string,
  payload: CursorBuildPayload,
) => {
  const dir = path.join(BUILD_ROOT, buildId);
  await fs.mkdir(dir, { recursive: true });

  const data: UploadFormData = {
    name: payload.name,
    frames: payload.frames.map((frame) => dataUrlToBytes(frame)),
    platform: payload.platform,
    size: payload.size,
    delay: payload.delay,
    mode: payload.mode,
  };

  const { name, errors } = await storeCursors(buildId, data);

  return {
    id: buildId,
    files: name && errors.length === 0 ? [name] : [],
    error: errors.length > 0 ? errors : null,
  };
};

export const packageCursorBuild = async (options: {
  buildId: string;
  platform: Platform;
  name: string;
  version: string;
}) => {
  const params: DownloadParams = {
    name: options.name,
    version: options.version,
    platform: options.platform,
  };

  const result = await compressPackage(options.buildId, params);

  return {
    id: options.buildId,
    path: result.file ?? null,
    name: result.file ? path.basename(result.file) : null,
    error: result.errors.length > 0 ? result.errors : null,
  };
};

export const readPackagedCursor = async (filePath: string) =>
  fs.readFile(filePath);

export const getPackageContentType = (fileName: string) => {
  if (fileName.endsWith('.zip')) {
    return 'application/zip';
  }

  if (fileName.endsWith('.tar.gz')) {
    return 'application/gzip';
  }

  return 'application/octet-stream';
};
