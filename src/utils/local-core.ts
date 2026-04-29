import crypto from 'node:crypto';

export const CORE_SESSION_COOKIE = 'cbuid';
export const HOSTED_PACKAGING_ERROR =
  'This Vercel deployment is an unofficial, modded Bibata preview. Cursor packaging is only available in local or self-hosted builds.';

export const isHostedPackagingDisabled = () => false;

export type CursorBuildPayload = {
  name: string;
  frames: string[];
  platform: 'png' | 'win' | 'x11';
  size: number;
  delay: number;
  mode: 'left' | 'right';
};

export const createBuildSessionId = () => crypto.randomUUID();
