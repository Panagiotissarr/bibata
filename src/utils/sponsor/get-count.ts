import { DownloadCounts } from 'bibata/misc';

export const getDownloadCounts = async (token?: string) => {
  // eslint-disable-next-line no-undef
  let headers: HeadersInit | undefined = undefined;
  if (token) {
    headers = {
      Authorization: `Bearer ${token}`
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let res: Response;
  try {
    res = await fetch('/api/db/download/count', {
      headers,
      signal: controller.signal
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Download count request timed out.');
    }

    if (e instanceof Error) {
      throw new Error(`Download count request failed: ${e.message}`);
    }

    throw new Error('Download count request failed.');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json();
  return data as DownloadCounts;
};
