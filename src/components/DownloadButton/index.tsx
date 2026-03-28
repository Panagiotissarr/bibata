'use client';

import React, { useEffect, useRef, useState } from 'react';

import { COLORS_MASK as mask, WATCH_COLORS } from '@root/configs';

import { CoreApi } from '@utils/core';
import { fetchX } from '@utils/fetchX';

import { DownloadSubButtons } from './sub-buttons';
import { DownloadError } from './error';
import { DownloadSVG, LockSVG, ProcessingSVG } from '@components/svgs';

import type { Platform, Type } from '@prisma/client';
import { AddDownloadData } from '@services/download';
import type { Color, ErrorLogs, SVG } from 'bibata/app';
import type { AuthToken } from 'bibata/core-api/types';
import type { DownloadFile } from 'bibata/core-api/responses';

type Props = {
  disabled?: boolean;
  lock?: boolean;
  auth: AuthToken;
  version: string;
  mode: 'left' | 'right';
  config: {
    type: string;
    color: Color;
    size: number;
    svgs: SVG[];
  };
};

type ProcessOptions = {
  platform: Platform;
  size: number;
};

export const DownloadButton: React.FC<Props> = (props) => {
  const { svgs, size, type, color } = props.config;
  const { id, token, role } = props.auth;

  const name = `Bibata-${type}`;

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Collecting Bitmaps...');
  const [errorLogs, setErrorLogs] = useState<ErrorLogs>({ text: '' });
  const [showDropdown, setShowDropdown] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const serializeError = (error: unknown) => {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return error;
  };

  const getAuthErrorText = (error: unknown) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Unable to prepare download. Try again.';
  };

  const printError = async (error: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  };

  const updateErrorLogs = (options: {
    text: string;
    key: string;
    error: unknown;
  }) => {
    setErrorLogs((current) => ({
      ...current,
      id,
      role,
      token,
      text: options.text,
      [options.key]: options.error
    }));
  };

  const getSvgColors = (cursorColor: Color) => ({
    [mask.base]: cursorColor.base,
    [mask.outline]: cursorColor.outline,
    [mask.watch?.bg!]: cursorColor.watch?.bg || cursorColor.base,
    [mask.watch?.c1!]: cursorColor.watch?.c1 || WATCH_COLORS.c1,
    [mask.watch?.c2!]: cursorColor.watch?.c2 || WATCH_COLORS.c2,
    [mask.watch?.c3!]: cursorColor.watch?.c3 || WATCH_COLORS.c3,
    [mask.watch?.c4!]: cursorColor.watch?.c4 || WATCH_COLORS.c4
  });

  const svgToPng = async (svgData: string, targetSize: number) =>
    new Promise<string>((resolve, reject) => {
      const image = new window.Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to prepare cursor frame for upload.'));
          return;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, targetSize, targetSize);
        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => {
        reject(new Error('Unable to load cursor frame for upload.'));
      };

      image.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    });

  const buildUploadFrames = async (svg: SVG, targetSize: number) => {
    const colors = getSvgColors(color);
    const frames: string[] = [];

    for (const url of svg.urls) {
      const response = await fetchX(url, {
        init: { next: { revalidate: 360 } },
        revalidate: 1200,
        group: 'bibata.svg-cache'
      });

      if (!response) {
        throw new Error(`Unable to fetch '${svg.name}' SVG data.`);
      }

      let svgData = await response.text();
      Object.entries(colors).forEach(([match, replace]) => {
        svgData = svgData.replace(new RegExp(match, 'ig'), replace);
      });

      frames.push(await svgToPng(svgData, targetSize));
    }

    return frames;
  };

  const processSvgs = async (
    api: CoreApi,
    items: SVG[],
    options: ProcessOptions
  ) => {
    for (const svg of items) {
      setLoadingText(`Processing '${svg.name}' ...`);
      const uploadFrames = await buildUploadFrames(svg, options.size);

      const upload = await api.uploadImages({
        name: svg.name,
        frames: uploadFrames,
        delay: 30,
        mode: props.mode,
        ...options
      });

      if (upload?.error) {
        const details = Array.isArray(upload.error)
          ? upload.error.filter(Boolean).join(' ')
          : '';

        updateErrorLogs({
          text: details || 'Oops.. Processing Failed! Try Again.',
          key: 'upload',
          error: upload.error
        });
        return upload;
      }
    }
  };

  const downloadFile = (file: DownloadFile) => {
    const url = window.URL.createObjectURL(new Blob([file.blob]));
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', file.name);

    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);

    setErrorLogs({ text: '' });
  };

  const storeToDB = async (platform: string) => {
    try {
      await fetch('/api/db/download/store', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          platform,
          type: type as Type,
          baseColor: color.base,
          outlineColor: color.outline,
          watchBGColor: color.watch?.bg || color.base
        } as AddDownloadData['data'])
      });
    } catch (error) {
      updateErrorLogs({
        text: 'Unexpected Internal Error.',
        key: 'count',
        error
      });
      printError(error);
    }
  };

  const handleDownload = async (platform: Platform) => {
    setLoadingText('Preparing Download...');
    setLoading(true);
    setErrorLogs({ text: '' });

    try {
      const api = new CoreApi();
      await api.refreshSession(token);

      setLoadingText('Preparing Requests ...');
      const upload = await processSvgs(api, svgs, { platform, size });

      if (upload?.error) {
        printError(upload.error);
        await api.refreshSession(token);
        return;
      }

      if (platform === 'win') {
        setLoadingText('Packaging Windows Cursors ...');
      } else if (platform === 'png') {
        setLoadingText('Compressing PNG files ...');
      } else {
        setLoadingText('Packaging XCursors ...');
      }

      const file = await api.download(platform, name, props.version);

      if ('blob' in file) {
        await storeToDB(platform);
        downloadFile(file);
      } else {
        printError(file.error);
        updateErrorLogs({
          text: 'Oops.. Packaging Failed! Try Again.',
          key: 'download',
          error: file.error || file
        });
      }
    } catch (error) {
      printError(error);
      updateErrorLogs({
        text: getAuthErrorText(error),
        key: 'auth',
        error: serializeError(error)
      });
    } finally {
      setLoading(false);
      setLoadingText('Collecting Bitmaps...');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!loading && !props.lock) {
      const api = new CoreApi();
      api.deleteSession().catch(() => undefined);
    }
  }, [loading, props.lock]);

  const busy = loading || props.disabled;

  return (
    <>
      <div className='flex justify-center'>
        <button
          ref={buttonRef}
          title={props.lock ? 'Download locked while loading cursor data.' : 'Download'}
          className='relative flex justify-center items-center uppercase gap-2 w-4/5 sm:w-1/3 lg:w-1/5 h-16 sm:h-20 rounded-full bg-green-600 transition hover:scale-105 active:scale-90 hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-80'
          disabled={props.disabled}
          onClick={() => setShowDropdown(!showDropdown)}>
          {props.lock ? (
            <LockSVG />
          ) : busy ? (
            <ProcessingSVG />
          ) : (
            <DownloadSVG />
          )}

          <p className='overflow-auto text-md font-bold'>
            {props.lock ? 'Preparing' : busy ? 'Processing' : 'Download'}
          </p>
        </button>
      </div>

      {showDropdown && (
        <div className='flex justify-center' ref={dropdownRef}>
          <div className='absolute clip-bottom h-2 w-4 bg-white/[.4]' />
          <div className='absolute w-full sm:w-1/2 lg:w-1/4 2xl:w-1/5 h-auto mt-2 z-10 px-6 sm:px-0'>
            <div className='bg-black backdrop-filter backdrop-blur-2xl firefox:bg-opacity-40 bg-opacity-40 border border-white/[.2] text-white rounded-3xl shadow-lg relative'>
              {props.lock || loading ? (
                <div className='flex flex-col p-6 justify-center items-center text-center'>
                  <div className='flex items-center justify-center'>
                    <div className='-ml-1 mr-3 h-4 w-4'>
                      <ProcessingSVG />
                    </div>
                    <p className='text-[10px] sm:text-sm'>
                      {props.lock ? 'Loading cursor data ...' : loadingText}
                    </p>
                  </div>
                  <p className='mt-3 max-w-xs text-[10px] sm:text-xs text-white/[.55]'>
                    This may take a while...
                  </p>
                </div>
              ) : (
                <>
                  <DownloadError
                    logs={errorLogs}
                    onClick={() => setErrorLogs({ text: '' })}
                  />
                  <DownloadSubButtons
                    disabled={busy}
                    version={props.version}
                    onClick={(platform) => handleDownload(platform)}
                  />
                  <div className='px-6 pb-5 pt-1 text-center'>
                    <p className='text-[10px] sm:text-xs text-white/[.55]'>
                      This may take a while...
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
