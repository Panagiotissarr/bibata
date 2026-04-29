import fs from 'node:fs';
import path from 'node:path';
import { Platform, DownloadParams } from './types';

const README = `[::] Bibata Cursor
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

const WIN_INSTALL = `
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
3. Go to 'Cursors'folder and click on 'Schemes' folder - all the available custom cursors that are
   installed will be listed here.
4. [Right Click] on the name of cursor file you want to uninstall; for eg.: 'Bibata Cursors' and
   click 'Delete'.
5. Click 'yes' when prompted.`;

const X_INSTALL = `
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

const WIN_README = README + WIN_INSTALL;
const X_README = README + X_INSTALL;

const readmeContent: Record<Platform, string> = {
  win: WIN_README,
  x11: X_README,
  png: README,
};

export const attachReadme = (dirPath: string, platform: Platform): void => {
  const txt = readmeContent[platform];
  if (txt) {
    fs.writeFileSync(path.join(dirPath, 'README.txt'), txt, 'utf8');
  }
};

export const attachLicense = (dirPath: string): void => {
  const licensePath = path.join(process.cwd(), 'LICENSE');
  if (fs.existsSync(licensePath)) {
    const txt = fs.readFileSync(licensePath, 'utf8');
    fs.writeFileSync(path.join(dirPath, 'LICENSE'), txt, 'utf8');
  }
};

export const attachVersionFile = (
  dirPath: string,
  buildId: string,
  params: DownloadParams,
): void => {
  const content = `ID=${buildId}
Author=Abdualkaiz Khatri <kaizmandhu@gmail.com>
Type=${params.name}
Version=${params.version}`;
  fs.writeFileSync(path.join(dirPath, 'VERSION'), content, 'utf8');
};

export const attachFiles = (
  buildId: string,
  dirPath: string,
  params: DownloadParams,
): void => {
  attachReadme(dirPath, params.platform);
  attachLicense(dirPath);
  attachVersionFile(dirPath, buildId, params);
};
