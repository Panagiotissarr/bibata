import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const nextBin = path.join(
  process.cwd(),
  'node_modules',
  'next',
  'dist',
  'bin',
  'next'
);

const cleanNextArtifacts = async () => {
  await fs.rm(path.join(process.cwd(), '.next'), {
    recursive: true,
    force: true
  });
};

const main = async () => {
  await cleanNextArtifacts();

  const child = spawn(process.execPath, [nextBin, 'dev'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: false
  });

  child.once('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });

  child.once('error', (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
