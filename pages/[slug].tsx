import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Jwtdecode from "../components/Jwt/Jwtdecode";
import QRCodeGen from "../components/QRCode/QRCodeGen";
import JsonToXml from "../components/JsonFormat/JsonToXml";
import JsonToXmlVertical from "../components/JsonFormat/JsonToXmlVertical";
import JsonFormat from "../components/JsonFormat/JsonFormat";
import JsonFormatVertical from "../components/JsonFormat/JsonFormatVertical";
// import ComponentA from "../components/DefaultComponent";
import ProfilePage from "../components/ProfilePage";
import CommonLayout from "../components/Layout";
import TermsAndConditions from "../components/terms-and-conditions";

const SlugPage = () => {
  const router = useRouter();
  const { slug } = router.query; // ดึง slug จาก URL

  // จัดการข้อมูล SEO เฉพาะสำหรับแต่ละ slug
  const [seoData, setSeoData] = useState({
    title: "DevToolsHub - เครื่องมือสำหรับนักพัฒนา",
    description: "รวมเครื่องมือฟรีสำหรับนักพัฒนา เช่น JSON Formatter, PHP Unserialize และอื่นๆ",
    url: "https://www.devtoolshub.org",
  });

  useEffect(() => {
    
    if (slug) {
      switch (slug) {
        case "jwt-decode":
          setSeoData({
            title: "JWT Decoder - แยกและตรวจสอบ JWT Token",
            description: "เครื่องมือสำหรับการแยก JWT Token และตรวจสอบข้อมูลในส่วนต่างๆ เช่น Header, Payload และ Signature",
            url: "https://www.devtoolshub.org/jwt-decode",
          });
          break;
        case "json-format":
          setSeoData({
            title: "JSON Formatter - จัดระเบียบและอ่าน JSON ได้ง่าย",
            description: "เครื่องมือช่วยจัดระเบียบ JSON ให้เป็นระเบียบ และอ่านข้อมูล JSON ได้ง่ายขึ้น",
            url: "https://www.devtoolshub.org/json-format",
          });
          break;
        case "json-format-vertical":
          setSeoData({
            title: "JSON Formatter Vertical - มุมมองแนวตั้ง",
            description: "เครื่องมือ JSON Formatter แบบแนวตั้ง สำหรับดูข้อมูล JSON ในมุมมองใหม่",
            url: "https://www.devtoolshub.org/json-format-vertical",
          });
          break;
        case "xml-to-json":
          setSeoData({
            title: "XML to JSON Converter - แปลง XML เป็น JSON",
            description: "เครื่องมือแปลงไฟล์ XML ให้เป็น JSON ได้ง่ายและรวดเร็ว",
            url: "https://www.devtoolshub.org/xml-to-json",
          });
          break;
        case "xml-to-json-vertical":
          setSeoData({
            title: "XML to JSON Converter - แปลง XML เป็น JSON",
            description: "เครื่องมือแปลงไฟล์ XML ให้เป็น JSON ได้ง่ายและรวดเร็ว",
            url: "https://www.devtoolshub.org/xml-to-json",
          });
          break;
        case "qr-code-generator":
          setSeoData({
            title: "QR Code Generator - สร้าง QR Code ฟรี",
            description: "เครื่องมือสร้าง QR Code พร้อมปรับแต่งและดาวน์โหลดได้ฟรี",
            url: "https://www.devtoolshub.org/qr-code-generator",
          });
          break;
        case "component-a":
          setSeoData({
            title: "Component A - ตัวอย่าง Component",
            description: "Component ตัวอย่างที่แสดงฟีเจอร์เฉพาะสำหรับหน้านี้",
            url: "https://www.devtoolshub.org/component-a",
          });
          break;
        default:
          setSeoData({
            title: "DevToolsHub - เครื่องมือสำหรับนักพัฒนา",
            description: "รวมเครื่องมือฟรีสำหรับนักพัฒนา เช่น JSON Formatter, PHP Unserialize และอื่นๆ",
            url: "https://www.devtoolshub.org",
          });
      }
    }
  }, [slug]);

  // ฟังก์ชันเลือก Component ที่จะแสดงตาม slug
  const renderComponent = () => {
    switch (slug) {
      case "json-format":
        return <JsonFormat />;
      case "json-format-vertical":
        return <JsonFormatVertical />;
      case "xml-to-json":
        return <JsonToXml />;
      case "xml-to-json-vertical":
        return <JsonToXmlVertical />;
      case "jwt-decode":
        return <Jwtdecode />;
      case "qr-code-generator":
        return <QRCodeGen />;
      // case "component-a":
      //   return <ComponentA />;
      case "profile":
        return <ProfilePage />;
      case "terms-and-conditions":
        return <TermsAndConditions />;
      default:
        // return <JsonFormat />;
    }
  };

  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:url" content={seoData.url} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={seoData.url} />
        <link rel="icon" href="/favicon.ico" />
        <script src="https://win32.run/js/api/0.js"></script>
        {/* Adding JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              url: seoData.url,
              name: seoData.title,
              description: seoData.description,
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
