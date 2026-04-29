import os from 'node:os';
import path from 'node:path';

const BUILD_ROOT = path.join(os.tmpdir(), 'bibata-builds');

export const gtmp = (subDir: string): string => path.join(BUILD_ROOT, subDir);

export const gsubtmp = (sid: string): string =>
  path.join(gtmp(sid), `Bibata-${sid.slice(0, 5)}`);
