import { promises as fs } from 'fs';
import path from 'path';

import { SVG } from 'bibata/app';

const TYPE_DIRS: Record<string, string> = {
  Modern: 'modern',
  ModernRight: 'modern-right',
  Original: 'original',
  OriginalRight: 'original-right'
};

const localSvgCache = new Map<string, SVG[]>();

const POPULAR_CURSOR_ORDER = [
  'left_ptr',
  'hand2',
  'hand1',
  'xterm',
  'wait',
  'left_ptr_watch',
  'crosshair',
  'move',
  'grabbing',
  'copy',
  'link',
  'dnd-copy',
  'dnd-link',
  'dnd_no_drop',
  'question_arrow',
  'plus',
  'pencil',
  'zoom-in',
  'zoom-out',
  'vertical-text',
  'right_ptr',
  'context-menu',
  'circle',
  'cross',
  'tcross',
  'pointer-move',
  'person',
  'pin',
  'dotbox',
  'center_ptr'
] as const;

const POPULARITY_RANK = new Map<string, number>(
  POPULAR_CURSOR_ORDER.map((name, index) => [name, index])
);

const candidateRoots = () =>
  [
    process.env.BIBATA_CURSOR_SVG_DIR,
    path.join(process.cwd(), 'public', 'bibata-cursor-svg'),
    path.join(process.cwd(), '.tmp-bibata-cursor', 'svg'),
    path.resolve(process.cwd(), '..', 'Bibata_Cursor', 'svg')
  ].filter((value): value is string => Boolean(value));

const pathExists = async (target: string) => {
  try {
    return await fs.stat(target);
  } catch {
    return null;
  }
};

const getSvgRoot = async () => {
  for (const root of candidateRoots()) {
    const stat = await pathExists(root);
    if (stat?.isDirectory()) {
      return root;
    }
  }

  return null;
};

const toDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;

const compareNames = (left: string, right: string) =>
  left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: 'base'
  });

const getPopularityBucket = (name: string) => {
  const explicitRank = POPULARITY_RANK.get(name);
  if (explicitRank !== undefined) {
    return [0, explicitRank] as const;
  }

  if (
    /(corner|side|tee|double_arrow|angle|sb_|top_|bottom_|left_|right_)/i.test(
      name
    )
  ) {
    return [2, 0] as const;
  }

  if (/wayland|x_cursor/i.test(name)) {
    return [3, 0] as const;
  }

  return [1, 0] as const;
};

const compareByPopularity = (left: SVG, right: SVG) => {
  const [leftBucket, leftRank] = getPopularityBucket(left.name);
  const [rightBucket, rightRank] = getPopularityBucket(right.name);

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket;
  }

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  if (left.isAnimated !== right.isAnimated) {
    return left.isAnimated ? -1 : 1;
  }

  return compareNames(left.name, right.name);
};

const readFrames = async (targetPath: string) => {
  const stat = await fs.stat(targetPath);

  if (stat.isDirectory()) {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    const frameFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
      .sort((left, right) => compareNames(left.name, right.name));

    return Promise.all(
      frameFiles.map((entry) =>
        fs.readFile(path.join(targetPath, entry.name), 'utf8')
      )
    );
  }

  return [await fs.readFile(targetPath, 'utf8')];
};

export const loadLocalSVGs = async (type: string, version: string) => {
  const typeDir = TYPE_DIRS[type];
  if (!typeDir) {
    return null;
  }

  const root = await getSvgRoot();
  if (!root) {
    return null;
  }

  const cacheKey = `${root}:${type}:${version}`;
  const cached = localSvgCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const sourceDir = path.join(root, typeDir);
  const sourceStat = await pathExists(sourceDir);
  if (!sourceStat?.isDirectory()) {
    return null;
  }

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const svgs: SVG[] = [];

  for (const entry of entries.sort((left, right) => compareNames(left.name, right.name))) {
    if (!entry.isFile()) {
      continue;
    }

    const entryPath = path.join(sourceDir, entry.name);
    const pointer = (await fs.readFile(entryPath, 'utf8')).trim();

    if (!pointer) {
      continue;
    }

    const targetPath = path.resolve(path.dirname(entryPath), pointer);
    const frames = await readFrames(targetPath);
    const name = entry.name.endsWith('.svg')
      ? entry.name.slice(0, -'.svg'.length)
      : entry.name;

    svgs.push({
      id: `img:local:${type}:${name}:${version}`,
      name,
      node_ids: [],
      urls: frames.map((frame) => toDataUrl(frame)),
      isAnimated: frames.length > 1
    });
  }

  const sorted = svgs.sort(compareByPopularity);

  localSvgCache.set(cacheKey, sorted);
  return sorted;
};
