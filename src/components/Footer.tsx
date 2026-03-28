'use client';

import React from 'react';

import Link from 'next/link';

import {
  BibataTypoLogo,
} from './svgs';

import { LIB_VERSION } from '@root/version';

type Props = {};

// eslint-disable-next-line no-unused-vars
export const Footer: React.FC<Props> = (_props) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-[--bg-dark] border-t border-white/[.1] p-3 mt-20'>
      <div className='container mx-auto'>
        <div className='flex justify-between items-center'>
          <Link className='hover:text-[--accent-active]' href='/'>
            <BibataTypoLogo size={50} />
          </Link>

          <ul className='flex-center gap-4 text-white/[.5]'>
            <div className='mt-5'>
              <p className='text-white/[.6] font-bold'>
                Copyright © {currentYear} Panagiotis Sarris
                </p>
              <p className='copyrightA text-left text-white/[.5] text-xs mt-1'>
                 Copyright © {currentYear} AbdulKaiz Khatri
              </p>
            </div>
          </ul>
        </div>

        <div className='pb-4 lg:pb-12'>
          <div className='flex items-center justify-start gap-1 font-mono tracking-tighter text-sm text-white/[.8]'>
            <p>
              <Link
                target='_blank'
                href='https://github.com/ful1e5/bibata/blob/main/LICENSE'
                className='inline-flex hover:text-white hover:underline'>
                MIT License
              </Link>
            </p>

            <p>•</p>

            <p>
              <Link
                target='_blank'
                href='https://github.com/ful1e5/bibata/releases'
                className='inline-flex hover:text-white hover:underline'>
                {`v${LIB_VERSION}`}
              </Link>
            </p>
          </div>

          <div className='mt-7 pt-3 border-t border-white/[.1] flex flex-col'>
            <div className='text-white/[.5] w-full sm:w-3/5 text-sm'>
              <h6 className='font-black'>Privacy Policy</h6>
              <p>
                Bibata is committed to ensuring the privacy of user information.
                We only collect necessary data. Some may also be retained to 
                enhance user experience.
              </p>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};
