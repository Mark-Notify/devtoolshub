import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router"; // Import useRouter
import Head from "next/head";
import CommonLayout from "components/Layout";
import QRCodeGen from "components/QRCode/QRCodeGen";
import JsonFormat from "components/JsonFormat/JsonFormat";
import JsonFormatVertical from "components/JsonFormat/JsonFormatVertical";
import ComponentA from "components/DefaultComponent";
import { SpeedInsights } from "@vercel/speed-insights/next"

const Home: NextPage = () => {
  const router = useRouter();
  const { type } = router.query; // ดึง query parameter จาก URL

  // ฟังก์ชันเลือก Component ที่จะแสดงตาม query parameter
  const renderComponent = () => {
    switch (type) {
      case "JsonFormat":
        return <JsonFormat />;
      case "JsonFormatVertical":
        return <JsonFormatVertical />;
      case "qr-code-generator":
        return <QRCodeGen />;
      default:
        return <JsonFormat />;
    }
  };

  return (
    <>
      <Head>
        <title>DevToolsHub - เครื่องมือสำหรับนักพัฒนา</title>
        <meta
          name="description"
          content="รวมเครื่องมือฟรีสำหรับนักพัฒนา เช่น JSON Formatter, PHP Unserialize และอื่นๆ"
        />
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: "https://devtoolshub.vercel.app/",
              name: "DevToolsHub",
              description: "ศูนย์รวมเครื่องมือสำหรับนักพัฒนา",
            }),
          }}
        />
      </Head>

      <CommonLayout>
        <div className="mt-4">
          {/* Render Component ตาม query parameter */}
          {renderComponent()}
        </div>
      </CommonLayout>
    </>
  );
};

export default Home;
