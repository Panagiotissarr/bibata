declare module 'bibata/app' {
  export type Role = 'USER' | 'PRO' | 'ADMIN' | 'ANONYMOUS';

  export type SVG = {
    id: string;
    name: string;
    node_ids: string[];
    urls: string[];
    isAnimated: boolean;
  };

  export type Color = {
    base: string;
    outline: string;
    watch?: {
      bg?: string;
      c1?: string;
      c2?: string;
      c3?: string;
      c4?: string;
    };
  };

  export type Colors = {
    [name: string]: Color;
  };

  export type Delay = {
    delay: number;
    frames: number;
  };

  export type Delays = {
    [key: number]: Delay;
  };

  export type Image = {
    name: string;
    frames: string[];
    delay: number;
  };

  export type ErrorLogs = {
    text: string;
    [k: string]: any;
  };
}

declare module 'bibata/misc' {
  import { Role } from 'bibata/app';

  export type Goals = {
    monthlySponsorshipInCents: number;
    percentComplete: number;
    title: string;
    targetValueInDollar: number;
  };

  export type Sponsor = {
    login: string;
    url: string;
    name: string;
    avatarUrl: string;
    dollar: number;
    tier: string;
  };

  export type LuckySponsor = {
    sponsors: Sponsor[];
    others: number;
    total_dollar: number;
  };

  export type DownloadCounts = {
    total: number | null;
    count: number;
    role: Role;
    error: any;
  };

  export type JWTToken = {
    token_id: string;
    role: Role;
  };
}

declare module 'bibata/core-api/types' {
  import { Role } from 'bibata/app';

  export type AuthToken = {
    id: string;
    role: Role;
    token: string;
  };
}

declare module 'bibata/core-api/responses' {
  import { Role } from 'bibata/app';

  export type AuthError = {
    status: number;
    error: string[];
  };

  export type UploadResponse = {
    id: string;
    files: string[];
    error: string[];
  };

  export type GetSessionResponse = {
    id: string;
    role: Role;
  };

  export type DeleteSessionResponse = {
    id: string | null;
  };

  export type DownloadError = {
    id: string;
    error: string[];
  };

  export type DownloadFile = {
    blob: Blob;
    name: string;
  };
}
