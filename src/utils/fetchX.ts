import type { BodyInit, RequestInit } from 'next/dist/server/web/spec-extension/request';

type Options = {
  init?: RequestInit;
  group?: string;
  revalidate?: number;
};

const hashObject = (body: BodyInit): string => {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
};

const getCacheKey = (url: string, init?: RequestInit) => {
  const cacheUrl = new URL(
    url,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  );

  if (init?.method?.toUpperCase() === 'POST' && init.body) {
    cacheUrl.searchParams.set('__fetchX', hashObject(init.body));
  }

  return cacheUrl.toString();
};

const getCacheStorage = () => {
  if (
    typeof globalThis === 'undefined' ||
    !('caches' in globalThis) ||
    !globalThis.caches
  ) {
    return null;
  }

  return globalThis.caches;
};

export const fetchX = async (url: string, options?: Options) => {
  const ttl = options?.revalidate || 360;
  const group = options?.group || 'bibata.misc';
  const init = options?.init;

  if (url.startsWith('data:')) {
    return fetch(url, { ...init });
  }

  const key = getCacheKey(url, init);
  const cacheStorage = getCacheStorage();

  if (!cacheStorage) {
    return fetch(url, { ...init });
  }

  try {
    const cache = await cacheStorage.open(group);
    let res = await cache.match(key);

    if (!res && !init?.signal?.aborted) {
      res = await fetch(url, { ...init });

      if (res && res.status === 200) {
        const cacheTimestamp = new Date().toUTCString();
        if (res.headers) {
          const headers = new Headers(res.headers);
          headers.set('x-cache-timestamp', cacheTimestamp);
          res = new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers
          });
          await cache.put(key, res.clone());
        } else {
          return;
        }
      } else {
        await cache.delete(key);
      }
    }

    if (!res?.headers) {
      return;
    } else {
      const cacheTimestamp = res.headers.get('x-cache-timestamp');
      if (cacheTimestamp) {
        const currentTime = Date.now();
        const cacheTime = new Date(cacheTimestamp).getTime();
        const cacheAge = (currentTime - cacheTime) / 1000;

        if (cacheAge > ttl) {
          await cache.delete(key);
        }
      }

      return res;
    }
  } catch (e) {
    if (init?.signal?.aborted) {
      return;
    }

    console.warn('Falling back to direct fetch after cache failure.', e);
    return fetch(url, { ...init });
  }
};
