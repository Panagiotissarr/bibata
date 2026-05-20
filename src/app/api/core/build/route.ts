import { NextRequest, NextResponse } from 'next/server';

import archiver from 'archiver';
import sharp from 'sharp';

export const runtime = 'nodejs';

type CursorFrame = {
  name: string;
  frames: string[];
};

type BuildPayload = {
  cursors: CursorFrame[];
  platform: 'png' | 'win' | 'x11';
  size: number;
  delay: number;
  mode: 'left' | 'right';
  name: string;
  version: string;
};

type CursorConfig = {
  x?: number;
  y?: number;
  winname?: string;
  xname?: string;
  links?: string[];
};

const MASTER_CURSOR_SIZE = 256;

const scaleHotspot = (value: number, size: number): number => {
  const scaled = Math.round((value / MASTER_CURSOR_SIZE) * size);
  return Math.max(0, Math.min(size - 1, scaled));
};

const configs: Record<string, CursorConfig> = {
  left_ptr: { x: 55, y: 17, winname: 'Pointer', xname: 'left_ptr', links: ['arrow', 'default', 'top_left_arrow'] },
  left_ptr_watch: { x: 55, y: 17, winname: 'Work', xname: 'left_ptr_watch', links: ['00000000000000020006000e7e9ffc3f', '08e8e1c95fe2fc01f976f1e063a24ccd', '3ecb610c1bf2410f44200f48c40d3599', 'progress'] },
  right_ptr: { x: 204, y: 17, winname: 'Alternate', xname: 'right_ptr', links: ['draft_large', 'draft_small'] },
  circle: { x: 55, y: 17, winname: 'Unavailable', xname: 'circle', links: ['forbidden'] },
  'context-menu': { x: 57, y: 17, xname: 'context-menu' },
  copy: { x: 55, y: 17, xname: 'copy', links: ['1081e37283d90000800003c07f3ef6bf', '6407b0e94181790501fd1e167b474872', 'b66166c04f8c3109214a4fbd64a50fc8'] },
  link: { x: 55, y: 17, xname: 'link', links: ['3085a0e285430894940527032f8b26df', '640fb0e74195791501fd1ed57b41487f', 'a2a266d0498c3104214a47bd64ab0fc8'] },
  hand1: { x: 144, y: 79, winname: 'Pan', xname: 'hand1', links: ['grab', 'openhand'] },
  hand2: { x: 114, y: 18, winname: 'Link', xname: 'hand2', links: ['9d800788f1b08800ae810202380a0822', 'e29285e634086352946a0e7090d73106', 'pointer', 'pointing_hand'] },
  grabbing: { x: 128, y: 66, winname: 'Grabbing', xname: 'grabbing', links: ['closedhand', 'dnd-move', 'dnd-none', 'fcf21c00b30f7e3f83fe0dfd12e71cff'] },
  move: { winname: 'Move', xname: 'move', links: ['4498f0e0c1937ffe01fd06f973665830', '9081237383d90e509aa00f00170e968f', 'all-scroll', 'fleur', 'size_all'] },
  wait: { x: 128, y: 128, winname: 'Busy', xname: 'wait', links: ['watch'] },
  xterm: { winname: 'Text', xname: 'xterm', links: ['ibeam', 'text'] },
  pencil: { x: 46, y: 211, winname: 'Handwriting', xname: 'pencil', links: ['draft'] },
  crosshair: { winname: 'Cross', xname: 'crosshair' },
  'zoom-in': { x: 116, y: 116, winname: 'Zoom-in', xname: 'zoom-in' },
  'zoom-out': { x: 116, y: 116, winname: 'Zoom-out', xname: 'zoom-out' },
  cross: { xname: 'cross', links: ['cross_reverse', 'diamond_cross'] },
  'vertical-text': { xname: 'vertical-text' },
  'wayland-cursor': { xname: 'wayland-cursor' },
  X_cursor: { xname: 'X_cursor', links: ['pirate', 'x-cursor'] },
  question_arrow: { x: 42, y: 86, winname: 'Help', xname: 'question_arrow', links: ['5c6cd98b3f3ebcb1f9c7f1c204630408', 'd9ce0ab605698f320427677b458ad60b', 'help', 'left_ptr_help', 'whats_this'] },
  tcross: { xname: 'tcross', links: ['color-picker'] },
  'pointer-move': { x: 55, y: 17, xname: 'pointer-move' },
  dnd_no_drop: { x: 100, y: 65, xname: 'dnd_no_drop', links: ['no-drop'] },
  'dnd-ask': { x: 100, y: 65, xname: 'dnd-ask' },
  'dnd-copy': { x: 100, y: 65, xname: 'dnd-copy' },
  'dnd-link': { x: 100, y: 65, xname: 'dnd-link', links: ['alias'] },
  dotbox: { xname: 'dotbox', links: ['dot_box_mask', 'draped_box', 'icon', 'target'] },
  top_left_corner: { x: 29, y: 24, xname: 'top_left_corner', links: ['nw-resize'] },
  top_right_corner: { x: 229, y: 24, xname: 'top_right_corner', links: ['ne-resize'] },
  top_side: { x: 128, y: 23, xname: 'top_side', links: ['n-resize'] },
  top_tee: { x: 128, y: 27, xname: 'top_tee' },
  bottom_left_corner: { x: 26, y: 232, xname: 'bottom_left_corner', links: ['sw-resize'] },
  bottom_right_corner: { x: 229, y: 232, xname: 'bottom_right_corner', links: ['se-resize'] },
  bottom_side: { x: 129, y: 234, xname: 'bottom_side', links: ['s-resize'] },
  bottom_tee: { x: 128, y: 230, xname: 'bottom_tee' },
  left_side: { x: 21, y: 128, xname: 'left_side', links: ['w-resize'] },
  left_tee: { x: 230, y: 128, xname: 'left_tee' },
  right_side: { x: 233, y: 128, xname: 'right_side', links: ['e-resize'] },
  right_tee: { x: 29, y: 128, xname: 'right_tee' },
  sb_down_arrow: { x: 128, y: 222, xname: 'sb_down_arrow', links: ['down-arrow'] },
  sb_up_arrow: { x: 128, y: 33, xname: 'sb_up_arrow', links: ['up-arrow'] },
  sb_left_arrow: { x: 33, y: 128, xname: 'sb_left_arrow', links: ['left-arrow'] },
  sb_right_arrow: { x: 223, y: 128, xname: 'sb_right_arrow', links: ['right-arrow'] },
  sb_h_double_arrow: { winname: 'Horz', xname: 'sb_h_double_arrow', links: ['028006030e0e7ebffc7f7070c0600140', '14fef782d02440884392942c1120523', 'col-resize', 'ew-resize', 'h_double_arrow', 'size-hor', 'size_hor', 'split_h'] },
  sb_v_double_arrow: { winname: 'Vert', xname: 'sb_v_double_arrow', links: ['00008160000006810000408080010102', '2870a09082c103050810ffdffffe0204', 'double_arrow', 'ns-resize', 'row-resize', 'size-ver', 'size_ver', 'split_v', 'v_double_arrow'] },
  crossed_circle: { xname: 'crossed_circle', links: ['03b6e0fcb3499374a867c041f52298f0', 'not-allowed'] },
  ll_angle: { x: 30, y: 223, xname: 'll_angle' },
  lr_angle: { x: 224, y: 230, xname: 'lr_angle' },
  ul_angle: { x: 33, y: 33, xname: 'ul_angle' },
  ur_angle: { x: 225, y: 33, xname: 'ur_angle' },
  plus: { xname: 'plus', links: ['cell'] },
  bd_double_arrow: { winname: 'Dgn1', xname: 'bd_double_arrow', links: ['c7088f0f3e6c8088236ef8e1e3e70000', 'nwse-resize', 'size_fdiag'] },
  fd_double_arrow: { winname: 'Dgn2', xname: 'fd_double_arrow', links: ['fcf1c3c7cd4491d801f1e1c78f100000', 'nesw-resize', 'size_bdiag'] },
  person: { x: 55, y: 17, winname: 'Person' },
  pin: { x: 55, y: 17, winname: 'Pin' },
  center_ptr: { x: 127, y: 17, xname: 'center_ptr' },
};

const rconfigs: Record<string, CursorConfig> = {
  left_ptr: { x: 207, y: 24, winname: 'Pointer', xname: 'left_ptr', links: ['arrow', 'default', 'top_left_arrow'] },
  left_ptr_watch: { x: 197, y: 24, winname: 'Work', xname: 'left_ptr_watch', links: ['00000000000000020006000e7e9ffc3f', '08e8e1c95fe2fc01f976f1e063a24ccd', '3ecb610c1bf2410f44200f48c40d3599', 'progress'] },
  right_ptr: { x: 55, y: 17, winname: 'Alternate', xname: 'right_ptr', links: ['draft_large', 'draft_small'] },
  circle: { x: 207, y: 24, winname: 'Unavailable', xname: 'circle', links: ['forbidden'] },
  'context-menu': { x: 207, y: 24, xname: 'context-menu' },
  copy: { x: 207, y: 24, xname: 'copy', links: ['1081e37283d90000800003c07f3ef6bf', '6407b0e94181790501fd1e167b474872', 'b66166c04f8c3109214a4fbd64a50fc8'] },
  link: { x: 207, y: 24, xname: 'link', links: ['3085a0e285430894940527032f8b26df', '640fb0e74195791501fd1ed57b41487f', 'a2a266d0498c3104214a47bd64ab0fc8'] },
  'pointer-move': { x: 207, y: 24, xname: 'pointer-move' },
  person: { x: 207, y: 24, winname: 'Person' },
  pin: { x: 207, y: 24, winname: 'Pin' },
};

const createCurFile = async (frame: Buffer, size: number, x: number, y: number): Promise<Buffer> => {
  const pngData = await resizePng(frame, size);

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(2, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(x, 4);
  entry.writeUInt16LE(y, 5);
  entry.writeUInt32LE(pngData.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngData]);
};

const riffPad = (buf: Buffer): Buffer => {
  if (buf.length % 2 !== 0) {
    return Buffer.concat([buf, Buffer.alloc(1)]);
  }
  return buf;
};

const writeChunk = (id: string, data: Buffer): Buffer => {
  const header = Buffer.alloc(8);
  header.write(id.slice(0, 4).padEnd(4, ' '), 0, 'ascii');
  header.writeUInt32LE(data.length, 4);
  return Buffer.concat([header, riffPad(data)]);
};

const writeList = (type: string, content: Buffer): Buffer => {
  const typeBuf = Buffer.alloc(4);
  typeBuf.write(type.slice(0, 4).padEnd(4, ' '), 0, 'ascii');
  const inner = Buffer.concat([typeBuf, riffPad(content)]);
  return writeChunk('LIST', inner);
};

const createAniFile = async (frames: Buffer[], size: number, x: number, y: number, delay: number): Promise<Buffer> => {
  const curFiles = await Promise.all(frames.map((f) => createCurFile(f, size, x, y)));

  const jiffies = Math.round(delay / (1000 / 60));

  const rateTable = Buffer.alloc(4 * frames.length);
  for (let i = 0; i < frames.length; i++) {
    rateTable.writeUInt32LE(jiffies, i * 4);
  }

  const anihHeader = Buffer.alloc(36);
  anihHeader.writeUInt32LE(36, 0);
  anihHeader.writeUInt32LE(frames.length, 4);
  anihHeader.writeUInt32LE(frames.length, 8);
  anihHeader.writeUInt32LE(size, 12);
  anihHeader.writeUInt32LE(size, 16);
  anihHeader.writeUInt32LE(0, 20);
  anihHeader.writeUInt32LE(0, 24);
  anihHeader.writeUInt32LE(jiffies, 28);
  anihHeader.writeUInt32LE(0x00000001, 32);

  const framParts: Buffer[] = [];
  for (const cur of curFiles) {
    framParts.push(writeChunk('icon', cur));
  }
  const framList = writeList('fram', Buffer.concat(framParts));

  const anihChunk = writeChunk('anih', anihHeader);
  const rateChunk = writeChunk('rate', rateTable);

  const inamData = Buffer.concat([Buffer.from('Bibata Cursor', 'utf8'), Buffer.alloc(1)]);
  const inamChunk = writeChunk('INAM', inamData);
  const infoList = writeList('INFO', inamChunk);

  const riffType = Buffer.alloc(4);
  riffType.write('ACON', 0, 'ascii');

  const content = Buffer.concat([
    riffType,
    infoList,
    anihChunk,
    rateChunk,
    framList,
  ]);

  const riffHeader = Buffer.alloc(8);
  riffHeader.write('RIFF', 0, 'ascii');
  riffHeader.writeUInt32LE(content.length, 4);

  return Buffer.concat([riffHeader, riffPad(content)]);
};

const resizePng = async (frame: Buffer, size: number): Promise<Buffer> => {
  return sharp(frame).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).png().toBuffer();
};

const dataUrlToBytes = (value: string): Buffer => {
  if (value.includes(',')) {
    const [, encoded] = value.split(',', 2);
    return Buffer.from(encoded, 'base64');
  }
  return Buffer.from(value, 'base64');
};

const createZipArchive = async (
  files: { name: string; data: Buffer }[],
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err) => reject(err));

    for (const file of files) {
      archive.append(file.data, { name: file.name });
    }

    archive.finalize();
  });
};

const createTarGzArchive = async (
  files: { name: string; data: Buffer }[],
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('tar', { gzip: true });

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err) => reject(err));

    for (const file of files) {
      archive.append(file.data, { name: file.name });
    }

    archive.finalize();
  });
};

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

const generateWinInstallInf = (themeName: string, cursorData: { name: string; frames: string[] }[]): string => {
  const cursorDir = `Cursors\\${themeName}`;

  type CursorRole = {
    regKey: string;
    bibataName: string;
  };

  const roles: CursorRole[] = [
    { regKey: 'Arrow', bibataName: 'left_ptr' },
    { regKey: 'Help', bibataName: 'question_arrow' },
    { regKey: 'AppStarting', bibataName: 'left_ptr_watch' },
    { regKey: 'Wait', bibataName: 'wait' },
    { regKey: 'Crosshair', bibataName: 'crosshair' },
    { regKey: 'IBeam', bibataName: 'xterm' },
    { regKey: 'NWPen', bibataName: 'pencil' },
    { regKey: 'No', bibataName: 'circle' },
    { regKey: 'SizeNS', bibataName: 'sb_v_double_arrow' },
    { regKey: 'SizeWE', bibataName: 'sb_h_double_arrow' },
    { regKey: 'SizeNWSE', bibataName: 'bd_double_arrow' },
    { regKey: 'SizeNESW', bibataName: 'fd_double_arrow' },
    { regKey: 'SizeAll', bibataName: 'move' },
    { regKey: 'UpArrow', bibataName: 'sb_up_arrow' },
    { regKey: 'Hand', bibataName: 'hand2' },
    { regKey: 'Person', bibataName: 'person' },
    { regKey: 'Pin', bibataName: 'pin' },
  ];

  const seenFiles = new Set<string>();
  const fileEntries: string[] = [];
  const stringEntries: Record<string, string> = {
    INF_Provider: 'Bibata',
    CUR_DIR: cursorDir,
    SCHEME_NAME: themeName,
  };

  const schemePaths: string[] = [];
  const wregLines: string[] = [];

  for (const role of roles) {
    const cursor = cursorData.find((c) => c.name === role.bibataName);
    if (!cursor || cursor.frames.length === 0) continue;

    const config = configs[cursor.name];
    if (!config?.winname) continue;

    const ext = cursor.frames.length > 1 ? '.ani' : '.cur';
    const fileName = `${config.winname}${ext}`;
    const varName = role.regKey.toLowerCase();

    stringEntries[varName] = fileName;

    if (!seenFiles.has(fileName)) {
      fileEntries.push(`"${fileName}"`);
      seenFiles.add(fileName);
    }

    schemePaths.push(`%10%\\%CUR_DIR%\\%${varName}%`);
    wregLines.push(`HKCU,"Control Panel\\Cursors",${role.regKey},0x00020000,"%10%\\%CUR_DIR%\\%${varName}%"`);
  }

  const lines = [
    '[Version]',
    'signature="$Windows NT$"',
    'provider=%INF_Provider%',
    '',
    '[DefaultInstall]',
    'CopyFiles = Scheme.Cur',
    'AddReg    = Scheme.Reg,Wreg',
    '',
    '[DestinationDirs]',
    'Scheme.Cur = 10,"%CUR_DIR%"',
    '',
    '[Scheme.Reg]',
    `HKCU,"Control Panel\\Cursors\\Schemes","%SCHEME_NAME%",,"${schemePaths.join(',')}"`,
    '',
    '[Wreg]',
    `HKCU,"Control Panel\\Cursors",,0x00020000,"%SCHEME_NAME%"`,
    ...wregLines,
    `HKLM,"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Runonce\\Setup\\","",,"rundll32.exe shell32.dll,Control_RunDLL main.cpl @0,1"`,
    '',
    '[Scheme.Cur]',
    ...fileEntries,
    '',
    '[Strings]',
    ...Object.entries(stringEntries).map(([key, value]) => `${key.padEnd(16)}= "${value}"`),
    '',
  ];

  return lines.join('\r\n');
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BuildPayload;

    const { cursors, platform, size, delay, mode, name, version } = body;

    if (!cursors || cursors.length === 0) {
      return NextResponse.json({ error: ['No cursor data provided.'] }, { status: 400 });
    }

    if (!platform || !size || !name || !version) {
      return NextResponse.json({ error: ['Missing required build parameters.'] }, { status: 400 });
    }

    const archiveFiles: { name: string; data: Buffer }[] = [];

    for (const cursor of cursors) {
      const config = mode === 'right'
        ? rconfigs[cursor.name] || configs[cursor.name]
        : configs[cursor.name];

      if (!config) {
        return NextResponse.json({ error: [`Unknown cursor: ${cursor.name}`] }, { status: 400 });
      }

      const frames = cursor.frames.map((f) => dataUrlToBytes(f));

      if (frames.length === 0) continue;

      if (platform === 'png') {
        if (frames.length === 1) {
          const pngData = await resizePng(frames[0], size);
          archiveFiles.push({ name: `${cursor.name}.png`, data: pngData });
        } else {
          const maxDigits = String(frames.length).length;
          for (let i = 0; i < frames.length; i++) {
            const index = String(i + 1).padStart(maxDigits, '0');
            const pngData = await resizePng(frames[i], size);
            archiveFiles.push({ name: `${cursor.name}-${index}.png`, data: pngData });
          }
        }
      }

      if (platform === 'win' && config.winname) {
        if (frames.length > 1) {
          const aniData = await createAniFile(frames, size, config.x ?? 0, config.y ?? 0, delay);
          archiveFiles.push({ name: `Cursors/${config.winname}.ani`, data: aniData });
        } else {
          const curData = await createCurFile(frames[0], size, config.x ?? 0, config.y ?? 0);
          archiveFiles.push({ name: `Cursors/${config.winname}.cur`, data: curData });
        }
      }

      if (platform === 'x11' && config.xname) {
        const cursorName = config.xname;
        if (frames.length === 1) {
          const pngData = await resizePng(frames[0], size);
          archiveFiles.push({ name: cursorName, data: pngData });
          if (config.links) {
            for (const link of config.links) {
              archiveFiles.push({ name: link, data: pngData });
            }
          }
        } else {
          const maxDigits = String(frames.length).length;
          for (let i = 0; i < frames.length; i++) {
            const index = String(i + 1).padStart(maxDigits, '0');
            const pngData = await resizePng(frames[i], size);
            archiveFiles.push({ name: `${cursorName}-${index}.png`, data: pngData });
            if (i === 0 && config.links) {
              for (const link of config.links) {
                archiveFiles.push({ name: link, data: pngData });
              }
            }
          }
        }
      }
    }

    const readmeContent = platform === 'win' ? WIN_README : platform === 'x11' ? X_README : README_TEXT;
    archiveFiles.push({ name: 'README.md', data: Buffer.from(readmeContent, 'utf8') });

    archiveFiles.push({
      name: 'VERSION',
      data: Buffer.from(`ID=cursor-build\nAuthor=Abdualkaiz Khatri <kaizmandhu@gmail.com>\nType=${name}\nVersion=${version}`, 'utf8'),
    });

    if (platform === 'win') {
      archiveFiles.push({
        name: 'Cursors/install.inf',
        data: Buffer.from(generateWinInstallInf(name, cursors), 'utf8'),
      });
    }

    const archiveData = platform === 'x11'
      ? await createTarGzArchive(archiveFiles)
      : await createZipArchive(archiveFiles);

    const ext = platform === 'x11' ? '.tar.gz' : '.zip';
    const fileName = `${name.toLowerCase()}${ext}`;

    return new NextResponse(archiveData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': platform === 'x11' ? 'application/gzip' : 'application/zip',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Build failed.';
    return NextResponse.json({ error: [message] }, { status: 500 });
  }
}
