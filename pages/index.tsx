import * as React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRecoilState } from 'recoil';
import { homePageBookSumState, homePageQueryState } from 'atoms';

import CommonLayout from 'components/Layout';
import JsonFormat from 'components/JsonFormat/JsonFormat';
import { PAGE_SIZE } from 'const';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Bookstore Home</title>
        <meta name='description' content='Bookstore Home Page' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <CommonLayout>
        <JsonFormat />
      </CommonLayout>
    </>
  );
};

export default Home;
