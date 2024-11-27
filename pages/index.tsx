import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useRecoilState } from "recoil";
import CommonLayout from "components/Layout";
import JsonFormat from "components/JsonFormat/JsonFormat";
import ComponentA from "components/DefaultComponent";
import { homePageQueryState } from "atoms"; // เพิ่มการใช้ Recoil

const Home: NextPage = () => {
  const [homePageQueryData] = useRecoilState(homePageQueryState);

  // ฟังก์ชันเลือก Component ที่จะแสดงตามประเภท
  const renderComponent = () => {
    switch (homePageQueryData.type) {
      case "UnSerialized":
        return <JsonFormat />;
      case "xxx":
        return <ComponentA />;
      default:
        return <JsonFormat />;
    }
  };

  return (
    <>
      <Head>
        <title>DevToolsHub - เครื่องมือสำหรับนักพัฒนา</title>
        <meta name="description" content="รวมเครื่องมือฟรีสำหรับนักพัฒนา เช่น JSON Formatter, PHP Unserialize และอื่นๆ" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CommonLayout>
        {/* แสดง Component ที่เลือก */}
        <div className="mt-4">{renderComponent()}</div>
      </CommonLayout>
    </>
  );
};

export default Home;
