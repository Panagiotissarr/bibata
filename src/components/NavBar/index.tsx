'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BibataTypoLogo } from '@components/svgs';

type Props = {};

// eslint-disable-next-line no-unused-vars
export const NavBar: React.FC<Props> = (_props) => {
  const pathname = usePathname();

  return (
    <header
      className={`sticky py-px top-0 z-20 ${
        pathname === '/'
          ? 'bg-[--bg-dark]'
          : 'bg-[#151515] backdrop-filter backdrop-blur-xl border-b border-white/[.1] firefox:bg-opacity-95 bg-opacity-95'
      } `}>
      <nav>
        <div className='container mx-auto p-3 md:p-4 flex flex-col sm:flex-row items-center justify-between gap-3'>
          <Link href='/'>
            <div className='overflow-hidden flex items-center justify-center gap-2'>
              <span className='inline-flex items-center gap-1'>
                <span
                  className={`hover:text-white/[.8] transition active:scale-95 ${
                    pathname === '/' ? 'text-[--accent]' : 'text-white'
                  }`}>
                  <BibataTypoLogo />
                </span>
              </span>
            </div>
          </Link>

          <p className='text-[10px] sm:text-xs leading-5 text-white/[.3] text-center sm:text-right uppercase tracking-wider'>
            <b>Unofficial Edited Build</b> — Not the original Bibata website.
          </p>
        </div>
      </nav>
    </header>
  );
};
