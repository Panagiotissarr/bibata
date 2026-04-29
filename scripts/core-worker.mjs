#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import archiver from 'archiver';

/**
 * @typedef {'png' | 'win' | 'x11'} Platform
 * @typedef {'left' | 'right'} CursorMode
 * 
 * @typedef {Object} CursorConfig
 * @property {number} [x]
 * @property {number} [y]
 * @property {string} [winname]
 * @property {string} [xname]
 * @property {string[]} [links]
 * 
 * @typedef {Object} UploadFormData
 * @property {string} name
 * @property {Buffer[]} frames
 * @property {Platform} platform
 * @property {number} size
 * @property {number} delay
 * @property {CursorMode} mode
 * 
 * @typedef {Object} DownloadParams
 * @property {string} name
 * @property {string} version
 * @property {Platform} platform
 */

// --- Paths ---
const BUILD_ROOT = path.join(os.tmpdir(), 'bibata-builds');

const gtmp = (subDir) => path.join(BUILD_ROOT, subDir);

const gsubtmp = (sid) =>
  path.join(gtmp(sid), `Bibata-${sid.slice(0, 5)}`);

// --- Configs ---
const rconfigs = {
  left_ptr: {
    x: 207,
    y: 24,
    winname: 'Pointer',
    xname: 'left_ptr',
    links: ['arrow', 'default', 'top_left_arrow'],
  },
  left_ptr_watch: {
    x: 197,
    y: 24,
    winname: 'Work',
    xname: 'left_ptr_watch',
    links: [
      '00000000000000020006000e7e9ffc3f',
      '08e8e1c95fe2fc01f976f1e063a24ccd',
      '3ecb610c1bf2410f44200f48c40d3599',
      'progress',
    ],
  },
  right_ptr: {
    x: 55,
    y: 17,
    winname: 'Alternate',
    xname: 'right_ptr',
    links: ['draft_large', 'draft_small'],
  },
  circle: {
    x: 207,
    y: 24,
    winname: 'Unavailable',
    xname: 'circle',
    links: ['forbidden'],
  },
  'context-menu': {
    x: 207,
    y: 24,
    xname: 'context-menu',
  },
  copy: {
    x: 207,
    y: 24,
    xname: 'copy',
    links: [
      '1081e37283d90000800003c07f3ef6bf',
      '6407b0e94181790501fd1e167b474872',
      'b66166c04f8c3109214a4fbd64a50fc8',
    ],
  },
  link: {
    x: 207,
    y: 24,
    xname: 'link',
    links: [
      '3085a0e285430894940527032f8b26df',
      '640fb0e74195791501fd1ed57b41487f',
      'a2a266d0498c3104214a47bd64ab0fc8',
    ],
  },
  'pointer-move': {
    x: 207,
    y: 24,
    xname: 'pointer-move',
  },
  person: {
    x: 207,
    y: 24,
    winname: 'Person',
  },
  pin: {
    x: 207,
    y: 24,
    winname: 'Pin',
  },
};

const configs = {
  bd_double_arrow: {
    winname: 'Dgn1',
    xname: 'bd_double_arrow',
    links: ['c7088f0f3e6c8088236ef8e1e3e70000', 'nwse-resize', 'size_fdiag'],
  },
  bottom_left_corner: {
    x: 26,
    y: 232,
    xname: 'bottom_left_corner',
    links: ['sw-resize'],
  },
  bottom_right_corner: {
    x: 229,
    y: 232,
    xname: 'bottom_right_corner',
    links: ['se-resize'],
  },
  bottom_side: {
    x: 129,
    y: 234,
    xname: 'bottom_side',
    links: ['s-resize'],
  },
  bottom_tee: {
    x: 128,
    y: 230,
    xname: 'bottom_tee',
  },
  center_ptr: {
    x: 127,
    y: 17,
    xname: 'center_ptr',
  },
  circle: {
    x: 55,
    y: 17,
    winname: 'Unavailable',
    xname: 'circle',
    links: ['forbidden'],
  },
  'context-menu': {
    x: 57,
    y: 17,
    xname: 'context-menu',
  },
  copy: {
    x: 55,
    y: 17,
    xname: 'copy',
    links: [
      '1081e37283d90000800003c07f3ef6bf',
      '6407b0e94181790501fd1e167b474872',
      'b66166c04f8c3109214a4fbd64a50fc8',
    ],
  },
  cross: {
    xname: 'cross',
    links: ['cross_reverse', 'diamond_cross'],
  },
  crossed_circle: {
    xname: 'crossed_circle',
    links: ['03b6e0fcb3499374a867c041f52298f0', 'not-allowed'],
  },
  crosshair: {
    winname: 'Cross',
    xname: 'crosshair',
  },
  dnd_no_drop: {
    x: 100,
    y: 65,
    xname: 'dnd_no_drop',
    links: ['no-drop'],
  },
  'dnd-ask': {
    x: 100,
    y: 65,
    xname: 'dnd-ask',
  },
  'dnd-copy': {
    x: 100,
    y: 65,
    xname: 'dnd-copy',
  },
  'dnd-link': {
    x: 100,
    y: 65,
    xname: 'dnd-link',
    links: ['alias'],
  },
  dotbox: {
    xname: 'dotbox',
    links: ['dot_box_mask', 'draped_box', 'icon', 'target'],
  },
  fd_double_arrow: {
    winname: 'Dgn2',
    xname: 'fd_double_arrow',
    links: ['fcf1c3c7cd4491d801f1e1c78f100000', 'nesw-resize', 'size_bdiag'],
  },
  grabbing: {
    x: 128,
    y: 66,
    winname: 'Grabbing',
    xname: 'grabbing',
    links: [
      'closedhand',
      'dnd-move',
      'dnd-none',
      'fcf21c00b30f7e3f83fe0dfd12e71cff',
    ],
  },
  hand1: {
    x: 144,
    y: 79,
    winname: 'Pan',
    xname: 'hand1',
    links: ['grab', 'openhand'],
  },
  hand2: {
    x: 114,
    y: 18,
    winname: 'Link',
    xname: 'hand2',
    links: [
      '9d800788f1b08800ae810202380a0822',
      'e29285e634086352946a0e7090d73106',
      'pointer',
      'pointing_hand',
    ],
  },
  left_ptr: {
    x: 55,
    y: 17,
    winname: 'Pointer',
    xname: 'left_ptr',
    links: ['arrow', 'default', 'top_left_arrow'],
  },
  left_ptr_watch: {
    x: 55,
    y: 17,
    winname: 'Work',
    xname: 'left_ptr_watch',
    links: [
      '00000000000000020006000e7e9ffc3f',
      '08e8e1c95fe2fc01f976f1e063a24ccd',
      '3ecb610c1bf2410f44200f48c40d3599',
      'progress',
    ],
  },
  left_side: {
    x: 21,
    y: 128,
    xname: 'left_side',
    links: ['w-resize'],
  },
  left_tee: {
    x: 230,
    y: 128,
    xname: 'left_tee',
  },
  link: {
    x: 55,
    y: 17,
    xname: 'link',
    links: [
      '3085a0e285430894940527032f8b26df',
      '640fb0e74195791501fd1ed57b41487f',
      'a2a266d0498c3104214a47bd64ab0fc8',
    ],
  },
  ll_angle: {
    x: 30,
    y: 223,
    xname: 'll_angle',
  },
  lr_angle: {
    x: 224,
    y: 230,
    xname: 'lr_angle',
  },
  move: {
    winname: 'Move',
    xname: 'move',
    links: [
      '4498f0e0c1937ffe01fd06f973665830',
      '9081237383d90e509aa00f00170e968f',
      'all-scroll',
      'fleur',
      'size_all',
    ],
  },
  pencil: {
    x: 46,
    y: 211,
    winname: 'Handwriting',
    xname: 'pencil',
    links: ['draft'],
  },
  plus: {
    xname: 'plus',
    links: ['cell'],
  },
  'pointer-move': {
    x: 55,
    y: 17,
    xname: 'pointer-move',
  },
  question_arrow: {
    x: 42,
    y: 86,
    winname: 'Help',
    xname: 'question_arrow',
    links: [
      '5c6cd98b3f3ebcb1f9c7f1c204630408',
      'd9ce0ab605698f320427677b458ad60b',
      'help',
      'left_ptr_help',
      'whats_this',
    ],
  },
  right_ptr: {
    x: 204,
    y: 17,
    winname: 'Alternate',
    xname: 'right_ptr',
    links: ['draft_large', 'draft_small'],
  },
  right_side: {
    x: 233,
    y: 128,
    xname: 'right_side',
    links: ['e-resize'],
  },
  right_tee: {
    x: 29,
    y: 128,
    xname: 'right_tee',
  },
  sb_down_arrow: {
    x: 128,
    y: 222,
    xname: 'sb_down_arrow',
    links: ['down-arrow'],
  },
  sb_h_double_arrow: {
    winname: 'Horz',
    xname: 'sb_h_double_arrow',
    links: [
      '028006030e0e7ebffc7f7070c0600140',
      '14fef782d02440884392942c1120523',
      'col-resize',
      'ew-resize',
      'h_double_arrow',
      'size-hor',
      'size_hor',
      'split_h',
    ],
  },
  sb_left_arrow: {
    x: 33,
    y: 128,
    xname: 'sb_left_arrow',
    links: ['left-arrow'],
  },
  sb_right_arrow: {
    x: 223,
    y: 128,
    xname: 'sb_right_arrow',
    links: ['right-arrow'],
  },
  sb_up_arrow: {
    x: 128,
    y: 33,
    xname: 'sb_up_arrow',
    links: ['up-arrow'],
  },
  sb_v_double_arrow: {
    winname: 'Vert',
    xname: 'sb_v_double_arrow',
    links: [
      '00008160000006810000408080010102',
      '2870a09082c103050810ffdffffe0204',
      'double_arrow',
      'ns-resize',
      'row-resize',
      'size-ver',
      'size_ver',
      'split_v',
      'v_double_arrow',
    ],
  },
  tcross: {
    xname: 'tcross',
    links: ['color-picker'],
  },
  top_left_corner: {
    x: 29,
    y: 24,
    xname: 'top_left_corner',
    links: ['nw-resize'],
  },
  top_right_corner: {
    x: 229,
    y: 24,
    xname: 'top_right_corner',
    links: ['ne-resize'],
  },
  top_side: {
    x: 128,
    y: 23,
    xname: 'top_side',
    links: ['n-resize'],
  },
  top_tee: {
    x: 128,
    y: 27,
    xname: 'top_tee',
  },
  ul_angle: {
    x: 33,
    y: 33,
    xname: 'ul_angle',
  },
  ur_angle: {
    x: 225,
    y: 33,
    xname: 'ur_angle',
  },
  'vertical-text': {
    xname: 'vertical-text',
  },
  wait: {
    winname: 'Busy',
    xname: 'wait',
    links: ['watch'],
  },
  'wayland-cursor': {
    xname: 'wayland-cursor',
  },
  X_cursor: {
    xname: 'X_cursor',
    links: ['pirate', 'x-cursor'],
  },
  xterm: {
    winname: 'Text',
    xname: 'xterm',
    links: ['ibeam', 'text'],
  },
  'zoom-in': {
    x: 116,
    y: 116,
    winname: 'Zoom-in',
    xname: 'zoom-in',
  },
  'zoom-out': {
    x: 116,
    y: 116,
    winname: 'Zoom-out',
    xname: 'zoom-out',
  },
  person: {
    x: 55,
    y: 17,
    winname: 'Person',
  },
  pin: {
    x: 55,
    y: 17,
    winname: 'Pin',
  },
};

// --- Files ---
const README_TEXT = `[::] Bibata Cursor
TLDR; This cursor set is a masterpiece of cursors available on the internet,
hand-designed by Abdulkaiz Khatri(https://twitter.com/ful1e5).

Bibata is an open source, compact, and material designed cursor set that aims
to improve the cursor experience for users. It is one of the most popular cursor sets
in the Linux community and is now available for free on Windows as well, with multiple color
and size options. Its goal is to offer personalized cursors to users.

[::] What does "Bibata" mean?
The sweetest word I ever spoke was "BI-Buh," which, coincidentally, is also the word for peanuts.
To make it more pronounceable and not sound like a baby's words, I added the suffix "Ta."
And with that, my journey in the world of open source began.

[::] Become Sponsor
https://github.com/sponsors/ful1e5

[::] LICENSE
MIT License

[::] Bug Reports & Contact
https://github.com/ful1e5/issues
`;

const WIN_INSTALL_TEXT = `
[::] Installation
1. Unzip '.zip' file
2. Open unziped directory in Explorer, and [Right Click] on 'install.inf'.
3. Click 'Install' from the context menu, and authorize the modifications to your system.
4. Open Control Panel > Personalization and Appearance > Change mouse pointers,
   and select 'Bibata Cursors'.
5. Click 'Apply'.

[::] Uninstallation - (i)
(i) Run the 'uninstall.bat' script packed with the '.zip' archive

[::] Uninstallation - (ii)
1. Go to 'Registry Editor' by typing the same in the 'start search box'.
2. Expand 'HKEY_CURRENT_USER' folder and expand 'Control Panel' folder.
3. Go to 'Cursors' folder and click on 'Schemes' folder - all the available custom cursors that are
   installed will be listed here.
4. [Right Click] on the name of cursor file you want to uninstall; for eg.: 'Bibata Cursors' and
   click 'Delete'.
5. Click 'yes' when prompted.`;

const X_INSTALL_TEXT = `
[::] Installation
\`\`\`bash
tar -xvf Bibata.tar.gz                # extract \`Bibata.tar.gz\`
mv Bibata-* ~/.icons/                 # Install to local users
sudo mv Bibata-* /usr/share/icons/    # Install to all users
\`\`\`

[::] Uninstallation
\`\`\`bash
rm ~/.icons/Bibata-*                  # Remove from local users
sudo rm /usr/share/icons/Bibata-*     # Remove from all users
\`\`\``;

const WIN_README = README_TEXT + WIN_INSTALL_TEXT;
const X_README = README_TEXT + X_INSTALL_TEXT;

const readmeContent = {
  win: WIN_README,
  x11: X_README,
  png: README_TEXT,
};

const attachReadme = (dirPath, platform) => {
  const txt = readmeContent[platform];
  if (txt) {
    fs.writeFileSync(path.join(dirPath, 'README.txt'), txt, 'utf8');
  }
};

const attachLicense = (dirPath) => {
  const licensePath = path.join(process.cwd(), 'LICENSE');
  if (fs.existsSync(licensePath)) {
    const txt = fs.readFileSync(licensePath, 'utf8');
    fs.writeFileSync(path.join(dirPath, 'LICENSE'), txt, 'utf8');
  }
};

const attachVersionFile = (dirPath, buildId, params) => {
  const content = `ID=${buildId}
Author=Abdualkaiz Khatri <kaizmandhu@gmail.com>
Type=${params.name}
Version=${params.version}`;
  fs.writeFileSync(path.join(dirPath, 'VERSION'), content, 'utf8');
};

const attachFiles = (buildId, dirPath, params) => {
  attachReadme(dirPath, params.platform);
  attachLicense(dirPath);
  attachVersionFile(dirPath, buildId, params);
};

// --- Cursor Builder ---
const MASTER_CURSOR_SIZE = 256;

const scaleHotspot = (value, size) => {
  const scaled = Math.round((value / MASTER_CURSOR_SIZE) * size);
  return Math.max(0, Math.min(size - 1, scaled));
};

const storeCursors = async (buildId, data) => {
  const errors = [];
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
    const resizePng = async (frame) => {
      return sharp(frame).resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      }).png().toBuffer();
    };

    if (platform === 'png') {
      if (frames.length === 1) {
        const pngData = await resizePng(frames[0]);
        fs.writeFileSync(path.join(tmpDir, `${name}.png`), pngData);
      } else {
        const maxDigits = String(frames.length).length;
        for (let i = 0; i < frames.length; i++) {
          const index = String(i + 1).padStart(maxDigits, '0');
          const pngData = await resizePng(frames[i]);
          fs.writeFileSync(path.join(tmpDir, `${name}-${index}.png`), pngData);
        }
      }
    }

    if (platform === 'win' && config.winname) {
      if (frames.length === 1) {
        const pngData = await resizePng(frames[0]);
        fs.writeFileSync(path.join(tmpDir, `${config.winname}.cur`), pngData);
      } else {
        const maxDigits = String(frames.length).length;
        for (let i = 0; i < frames.length; i++) {
          const index = String(i + 1).padStart(maxDigits, '0');
          const pngData = await resizePng(frames[i]);
          fs.writeFileSync(path.join(tmpDir, `${config.winname}-${index}.png`), pngData);
        }
      }
    }

    if (platform === 'x11' && config.xname) {
      const cursorName = config.xname;
      if (frames.length === 1) {
        const pngData = await resizePng(frames[0]);
        fs.writeFileSync(path.join(tmpDir, cursorName), pngData);
      } else {
        const maxDigits = String(frames.length).length;
        for (let i = 0; i < frames.length; i++) {
          const index = String(i + 1).padStart(maxDigits, '0');
          const pngData = await resizePng(frames[i]);
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

// --- Compress ---
const createZip = (sourceDir, outputPath) => {
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

const createTarGz = (sourceDir, outputPath) => {
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

const winCompress = async (buildId, params) => {
  const errors = [];
  const dir = gsubtmp(buildId);
  const name = `${params.name}-${buildId.slice(0, 5)}-v${params.version}-${params.platform}`;
  const fp = path.join(gtmp(buildId), `${name}.zip`);

  if (!fs.existsSync(fp)) {
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

const pngCompress = async (buildId, params) => {
  const errors = [];
  const dir = gsubtmp(buildId);
  const name = `${params.name}-${buildId.slice(0, 5)}-v${params.version}-${params.platform}`;
  const fp = path.join(gtmp(buildId), `${name}.zip`);

  if (!fs.existsSync(fp)) {
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

const x11Compress = async (buildId, params) => {
  const errors = [];
  const dir = gsubtmp(buildId);
  const name = `${params.name}-${buildId.slice(0, 5)}-v${params.version}-${params.platform}`;
  const fp = path.join(gtmp(buildId), `${name}.tar.gz`);

  if (!fs.existsSync(fp)) {
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

const packageCursorBuild = async (buildId, params) => {
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

// --- Worker CLI ---
const emit = (payload) => {
  process.stdout.write(JSON.stringify(payload));
  process.stdout.write('\n');
};

const dataUrlToBytes = (value) => {
  if (value.includes(',')) {
    const [, encoded] = value.split(',', 2);
    return Buffer.from(encoded, 'base64');
  }
  return Buffer.from(value, 'base64');
};

const handleDoctor = () => {
  emit({
    ok: true,
    node: process.version,
    platform: process.platform,
  });
};

const handleUpload = async (buildId, payloadPath) => {
  const payloadText = fs.readFileSync(payloadPath, 'utf8');
  const payload = JSON.parse(payloadText);

  const data = {
    name: String(payload.name),
    frames: payload.frames.map((frame) => dataUrlToBytes(frame)),
    platform: String(payload.platform),
    size: Number(payload.size),
    delay: Number(payload.delay),
    mode: payload.mode || 'left',
  };

  const { name, errors } = await storeCursors(buildId, data);

  emit({
    id: buildId,
    files: name && errors.length === 0 ? [name] : [],
    error: errors.length > 0 ? errors : null,
  });
};

const handleDownload = async (buildId, platform, name, version) => {
  const params = {
    name,
    version,
    platform,
  };

  const result = await packageCursorBuild(buildId, params);

  emit({
    id: buildId,
    path: result.file || null,
    name: result.file ? path.basename(result.file) : null,
    error: result.errors.length > 0 ? result.errors : null,
  });
};

const handleDestroy = async (buildId) => {
  const dir = gtmp(buildId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  emit({ id: buildId, ok: true });
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    emit({ error: ['Missing worker command.'] });
    return;
  }

  const command = args[0];

  try {
    if (command === 'doctor') {
      handleDoctor();
      return;
    }

    if (command === 'upload') {
      if (args.length !== 3) {
        emit({ error: ['Usage: upload <build_id> <payload_path>'] });
        return;
      }
      await handleUpload(args[1], args[2]);
      return;
    }

    if (command === 'download') {
      if (args.length !== 5) {
        emit({
          error: ['Usage: download <build_id> <platform> <name> <version>'],
        });
        return;
      }
      await handleDownload(args[1], args[2], args[3], args[4]);
      return;
    }

    if (command === 'destroy') {
      if (args.length !== 2) {
        emit({ error: ['Usage: destroy <build_id>'] });
        return;
      }
      await handleDestroy(args[1]);
      return;
    }

    emit({ error: [`Unknown worker command: ${command}`] });
  } catch (error) {
    emit({ error: [error instanceof Error ? error.message : String(error)] });
  }
};

main();
