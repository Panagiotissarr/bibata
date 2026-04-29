export type Platform = 'png' | 'win' | 'x11';
export type CursorMode = 'left' | 'right';

export type UploadFormData = {
  name: string;
  frames: Buffer[];
  platform: Platform;
  size: number;
  delay: number;
  mode: CursorMode;
  errors: string[];
};

export type DownloadParams = {
  name: string;
  version: string;
  platform: Platform;
  errors: string[];
};

export type CursorBuildPayload = {
  name: string;
  frames: string[];
  platform: Platform;
  size: number;
  delay: number;
  mode: CursorMode;
};

export type FileResponse = {
  file: string | null;
  errors: string[];
};
