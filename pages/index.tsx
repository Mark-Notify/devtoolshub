import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router"; // Import useRouter
import Head from "next/head";
import CommonLayout from "components/Layout";
import QRCodeGen from "components/QRCode/QRCodeGen";
import JsonToXml from "components/JsonFormat/JsonToXml";
import JsonFormat from "components/JsonFormat/JsonFormat";
import JsonFormatVertical from "components/JsonFormat/JsonFormatVertical";
import ComponentA from "components/DefaultComponent";

const Home: NextPage = () => {
  const router = useRouter();
  const { type } = router.query; // ดึง query parameter จาก URL

  // ฟังก์ชันเลือก Component ที่จะแสดงตาม query parameter
  const renderComponent = () => {
    switch (type) {
      case "json-format":
        return <JsonFormat />;
      case "json-format-vertical":
        return <JsonFormatVertical />;
      case "xml-to-json":
        return <JsonToXml />;
      case "qr-code-generator":
        return <QRCodeGen />;
      case "component-a":
        return <ComponentA />;
      default:
        return <div>Page not found</div>; // แสดงข้อความหาก slug ไม่ถูกต้อง
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
