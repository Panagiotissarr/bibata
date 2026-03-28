import 'server-only';

import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import type { Platform } from '@prisma/client';

const execFileAsync = promisify(execFile);

const BUILD_ROOT = path.join(os.tmpdir(), 'bibata-builds');
const WORKER_SCRIPT = path.join(process.cwd(), 'scripts', 'core-worker.py');
const WORKER_BUFFER_SIZE = 10 * 1024 * 1024;
const PYTHON_CANDIDATES =
  process.platform === 'win32' ? ['py', 'python'] : ['python3', 'python'];

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

type WorkerError = {
  error?: string[] | null;
};

type UploadWorkerResult = WorkerError & {
  id: string;
  files?: string[];
};

type DownloadWorkerResult = WorkerError & {
  id: string;
  path?: string | null;
  name?: string | null;
};

const parseWorkerJson = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getExecErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Cursor worker failed.';
};

const runWorker = async <T extends WorkerError>(args: string[]) => {
  let lastError: Error | null = null;

  for (const command of PYTHON_CANDIDATES) {
    try {
      const { stdout, stderr } = await execFileAsync(command, [WORKER_SCRIPT, ...args], {
        cwd: process.cwd(),
        windowsHide: true,
        maxBuffer: WORKER_BUFFER_SIZE
      });

      const data = parseWorkerJson(stdout);
      if (data) {
        return data as T;
      }

      throw new Error(stderr.trim() || 'Cursor worker returned invalid JSON.');
    } catch (error) {
      const execError = error as Error & { code?: string; stdout?: string; stderr?: string };

      if (execError.code === 'ENOENT') {
        lastError = execError;
        continue;
      }

      const data = parseWorkerJson(execError.stdout);
      if (data) {
        return data as T;
      }

      lastError = new Error(execError.stderr?.trim() || getExecErrorMessage(execError));
    }
  }

  throw lastError ?? new Error('Unable to find a Python runtime for cursor packaging.');
};

const writePayloadFile = async (buildId: string, payload: CursorBuildPayload) => {
  const dir = path.join(BUILD_ROOT, buildId);
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `request-${crypto.randomUUID()}.json`);
  await fs.writeFile(filePath, JSON.stringify(payload), 'utf8');
  return filePath;
};

export const createBuildSessionId = () => crypto.randomUUID();

export const destroyBuildArtifacts = async (buildId: string) => {
  await fs.rm(path.join(BUILD_ROOT, buildId), { recursive: true, force: true });
};

export const uploadCursorFrames = async (
  buildId: string,
  payload: CursorBuildPayload
) => {
  const payloadFile = await writePayloadFile(buildId, payload);

  try {
    const result = await runWorker<UploadWorkerResult>(['upload', buildId, payloadFile]);
    return {
      id: result.id,
      files: result.files ?? [],
      error: result.error ?? null
    };
  } finally {
    await fs.rm(payloadFile, { force: true });
  }
};

export const packageCursorBuild = async (options: {
  buildId: string;
  platform: Platform;
  name: string;
  version: string;
}) => {
  const result = await runWorker<DownloadWorkerResult>([
    'download',
    options.buildId,
    options.platform,
    options.name,
    options.version
  ]);

  return {
    id: result.id,
    path: result.path ?? null,
    name: result.name ?? null,
    error: result.error ?? null
  };
};

export const readPackagedCursor = async (filePath: string) => fs.readFile(filePath);

export const getPackageContentType = (fileName: string) => {
  if (fileName.endsWith('.zip')) {
    return 'application/zip';
  }

  if (fileName.endsWith('.tar.gz')) {
    return 'application/gzip';
  }

  return 'application/octet-stream';
};
