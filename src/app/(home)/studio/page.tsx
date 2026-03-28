'use client';

import { useEffect, useState } from 'react';
import tinycolor from 'tinycolor2';

import { TYPES, COLORS, SIZES } from '@root/configs';
import { LIB_VERSION } from '@root/version';

import { TypePicker } from '@components/TypePicker';
import { SizePicker } from '@components/SizePicker';
import { ColorPicker } from '@components/ColorPicker';
import { DownloadButton } from '@components/DownloadButton';
import { Cursors } from '@components/Cursors';

import { genAccessToken } from '@utils/auth/token';

import { SVG } from 'bibata/app';

export default function StudioPage() {
  const [type, setType] = useState(TYPES[0]);
  const [cursorMode, setCursorMode] = useState<'left' | 'right'>('left');
  const [cursorSize, setCursorSize] = useState(SIZES[3]);

  const [colorName, setColorName] = useState('Ice');
  const [color, setColor] = useState(COLORS[colorName]);
  const bg = tinycolor('#141414').toHexString();
  const tint1 = tinycolor.mix(bg, color.base, 2).toHexString();
  const tint2 = tinycolor.mix(bg, color.base, 3).toHexString();

  // eslint-disable-next-line no-unused-vars
  const [version, setVersion] = useState(LIB_VERSION);

  const [svgs, setSvgs] = useState<SVG[]>([]);

  const [token, setToken] = useState(genAccessToken());

  const resetImages = () => {
    setSvgs([]);
  };

  const refreshToken = () => {
    setToken(genAccessToken());
  };

  useEffect(() => {
    refreshToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main
      style={{
        background: `radial-gradient(circle at center, ${tint1} 0%, ${tint2} 50%, ${tint1} 75%, ${bg} 100%)`
      }}>
      <div className='container m-auto px-3 py-6'>
        <div className='mt-5'>
          <TypePicker
            list={TYPES.filter((a) => !a.match('Right'))}
            value={type}
            onChange={(t, rhm) => {
              if (t !== type) {
                resetImages();
                setType(t);
                setCursorMode(rhm ? 'right' : 'left');
                refreshToken();
              }
            }}
          />
        </div>

        <div className='mt-10'>
          <ColorPicker
            colorName={colorName}
            onClick={(n, c) => {
              if (c !== color) {
                resetImages();
                setColorName(n);
                setColor(c);
                refreshToken();
              }
            }}
          />
        </div>

        <div className='my-10'>
          <SizePicker
            list={SIZES}
            default={cursorSize}
            onChange={(s) => {
              if (s !== cursorSize) {
                setCursorSize(s);
                refreshToken();
              }
            }}
          />
        </div>

        <div className='mt-20 mb-12'>
          <DownloadButton
            auth={token}
            version={version}
            mode={cursorMode}
            disabled={svgs.length === 0}
            lock={svgs.length === 0}
            config={{
              size: cursorSize,
              color,
              svgs,
              type
            }}
          />
        </div>

        <Cursors
          type={type}
          version={version}
          color={color}
          onData={(items) => setSvgs(items)}
        />
      </div>
    </main>
  );
}
