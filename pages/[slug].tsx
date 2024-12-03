import { useRouter } from "next/router";
import React from "react";
import Head from "next/head";
import QRCodeGen from "components/QRCode/QRCodeGen";
import JsonToXml from "components/JsonFormat/JsonToXml";
import JsonFormat from "components/JsonFormat/JsonFormat";
import JsonFormatVertical from "components/JsonFormat/JsonFormatVertical";
import ComponentA from "components/DefaultComponent";
import CommonLayout from "components/Layout";

const SlugPage = () => {
  const router = useRouter();
  const { slug } = router.query; // ดึง slug จาก URL

  // ฟังก์ชันเลือก Component ที่จะแสดงตาม slug
  const renderComponent = () => {
    switch (slug) {
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
        <div className="mt-4">{renderComponent()}</div>
      </CommonLayout>
    </>
  );
};

export default SlugPage;
