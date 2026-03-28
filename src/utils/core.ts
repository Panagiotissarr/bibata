import type { Platform } from '@prisma/client';
import type { RequestInit } from 'next/dist/server/web/spec-extension/request';

import {
  AuthError,
  DeleteSessionResponse,
  DownloadError,
  DownloadFile,
  GetSessionResponse,
  UploadResponse
} from 'bibata/core-api/responses';
import { AuthToken } from 'bibata/core-api/types';

export class CoreApi {
  url: string;
  jwt: AuthToken | undefined;

  constructor() {
    this.url = '/api/core';
  }

  private __headers(token?: string) {
    return token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined;
  }

  private async __fetch(input: string, init?: RequestInit) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      return await fetch(input, {
        ...init,
        credentials: init?.credentials ?? 'include',
        signal: controller.signal
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new Error('Core API request timed out.');
      }

      if (e instanceof Error) {
        throw new Error(`Core API request failed: ${e.message}`);
      }

      throw new Error('Core API request failed.');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async getSession(token?: string) {
    const res = await this.__fetch(`${this.url}/session`, {
      headers: this.__headers(token),
      credentials: 'include'
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(
        data?.error || `Unable to authorize download session (${res.status}).`
      );
    }

    const data: GetSessionResponse = await res.json();
    this.jwt = { ...data, token: token || '' };
    return this.jwt;
  }

  public async deleteSession() {
    const res = await this.__fetch(`${this.url}/session`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await res.json();
    this.jwt = undefined;
    return data as DeleteSessionResponse;
  }

  public async refreshSession(token?: string) {
    await this.deleteSession();
    return await this.getSession(token);
  }

  public async uploadImages(body: Record<string, unknown>) {
    const headers = {
      ...(this.__headers(this.jwt?.token) ?? {}),
      'Content-Type': 'application/json'
    };

    const res = await this.__fetch(`${this.url}/upload`, {
      headers,
      method: 'POST',
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (res.status === 401) {
      return data as AuthError;
    } else {
      return data as UploadResponse;
    }
  }

  private __downloadUrl(p: Platform, n: string, v: string) {
    return `${this.url}/download?platform=${p}&name=${n}&v=${v}`;
  }

  public async download(p: Platform, n: string, v: string) {
    const res = await this.__fetch(this.__downloadUrl(p, n, v), {
      headers: this.__headers(this.jwt?.token)
    });

    if (res.status === 200) {
      try {
        const blob = await res.blob();
        const name =
          res.headers.get('Content-Disposition')?.split('filename=')[1] || null;

        if (!name) {
          return {
            id: this.jwt?.id,
            error: ['Unable to get download filename']
          } as DownloadError;
        }
        return { blob, name } as DownloadFile;
      } catch (e) {
        return {
          id: this.jwt?.id,
          error: [
            'Unhandle Exception Occur while downloading cursor package.',
            JSON.stringify(e)
          ]
        } as DownloadError;
      }
    } else if (res.status === 400) {
      const data = await res.json();
      return data as DownloadError;
    } else {
      return {
        id: this.jwt?.id,
        error: ['Internal Error Occur while downloading cursor package.']
      } as DownloadError;
    }
  }
}
