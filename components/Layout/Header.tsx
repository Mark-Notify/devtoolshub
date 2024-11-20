import * as React from 'react';
import NextLink from 'next/link';
import {
  Bars3Icon,
  ShoppingCartIcon,
  BookOpenIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

import BookTypeMenu from 'components/Layout/BookTypeMenu';
import { shoppingCartState } from 'atoms';
import { useRecoilState } from 'recoil';
import { calcCartItemSum } from 'lib/utils';
import Head from 'next/head';

export interface HeaderProps {
  hideMenu?: boolean;
}

export default function Header(props: HeaderProps) {
  const { hideMenu } = props;

  const [shoppingCart, setShoppingCart] = useRecoilState(shoppingCartState);

  return (
    <>
    <Head>
      <link
        href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&"
        rel="stylesheet"
      />
      
    </Head>
      <div className='navbar bg-base-100 mx-auto max-w-7xl mt-4 shadow-xl rounded-box'>
        <div className='navbar-start'>
          {!hideMenu && (
            <div className='dropdown'>
              <label
                tabIndex={0}
                className='btn btn-ghost btn-circle content-center'
              >
                <Bars3Icon className='w-6 h-6' />
              </label>
              <BookTypeMenu />
            </div>
          )}
        </div>
        <div className='navbar-center'>
          <NextLink href='/' className='btn btn-ghost normal-case text-xl'>
            <CodeBracketIcon className='w-8 h-8' />
            Programmer Helper Tool
          </NextLink>
        </div>
        <div className='navbar-end'>
          {/* <NextLink href='/cart' className='btn btn-ghost btn-circle'>
            <div className='indicator'>
              <ShoppingCartIcon className='w-6 h-6' />
              <span className='badge badge-sm indicator-item'>
                {calcCartItemSum(shoppingCart)}
              </span>
            </div>
          </NextLink> */}

          {/* <button className='btn btn-ghost btn-circle'>
              <div className='indicator'>
                <UserIcon className='w-6 h-6' />
                <span className='badge badge-xs badge-primary indicator-item'></span>
              </div>
            </button> */}
        </div>
      </div>
    </>
  );
}
