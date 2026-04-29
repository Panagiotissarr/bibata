import { spawn } from 'node:child_process';
import path from 'node:path';

const isWindows = process.platform === 'win32';
const nodeCandidates = isWindows ? ['node', 'node.exe'] : ['node'];
const workerScript = path.join('scripts', 'core-worker.mjs');

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 1}`));
      }
    });
  });

const canRun = (command) =>
  new Promise((resolve) => {
    const child = spawn(command, ['--version'], {
      cwd: process.cwd(),
      stdio: 'ignore',
      shell: false,
    });

    child.once('error', () => resolve(false));
    child.once('exit', (code) => resolve(code === 0));
  });

const main = async () => {
  for (const node of nodeCandidates) {
    if (!(await canRun(node))) {
      continue;
    }

    try {
      await run(node, [workerScript, 'doctor']);
      return;
    } catch {
      continue;
    }
  }

  throw new Error(
    `Unable to find a Node.js launcher. Tried: ${nodeCandidates.join(', ')}`,
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
