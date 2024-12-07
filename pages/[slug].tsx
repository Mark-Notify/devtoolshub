import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React from "react";
import Head from "next/head";
import Jwtdecode from "../components/Jwt/Jwtdecode";
import QRCodeGen from "../components/QRCode/QRCodeGen";
import JsonToXml from "../components/JsonFormat/JsonToXml";
import JsonToXmlVertical from "../components/JsonFormat/JsonToXmlVertical";
import JsonFormat from "../components/JsonFormat/JsonFormat";
import JsonFormatVertical from "../components/JsonFormat/JsonFormatVertical";
import ComponentA from "../components/DefaultComponent";
import CommonLayout from "../components/Layout";

// กำหนดประเภท (type) สำหรับ seoData
interface SeoData {
  title: string;
  description: string;
  url: string;
}

interface SlugPageProps {
  seoData: SeoData; // ระบุประเภทของ seoData
}

const SlugPage = ({ seoData }: SlugPageProps) => {
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
      case "xml-to-json-vertical":
        return <JsonToXmlVertical />;
      case "jwt-decode":
        return <Jwtdecode />;
      case "qr-code-generator":
        return <QRCodeGen />;
      case "component-a":
        return <ComponentA />;
      default:
        return <JsonFormat />;
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

// เพิ่ม type สำหรับ getServerSideProps
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params || {}; // ใช้การตรวจสอบค่า null/undefined

  if (typeof slug !== "string") {
    // กรณีที่ไม่มี slug หรือไม่ใช่ string
    return { notFound: true };
  }

  let seoData: SeoData = {
    title: "DevToolsHub - เครื่องมือสำหรับนักพัฒนา",
    description: "รวมเครื่องมือฟรีสำหรับนักพัฒนา เช่น JSON Formatter, PHP Unserialize และอื่นๆ",
    url: "https://www.devtoolshub.org",
  };

  // ตั้งค่า SEO Data ตาม slug
  if (slug === "jwt-decode") {
    seoData = {
      title: "JWT Decoder - แยกและตรวจสอบ JWT Token",
      description: "เครื่องมือสำหรับการแยก JWT Token และตรวจสอบข้อมูลในส่วนต่างๆ เช่น Header, Payload และ Signature",
      url: `https://www.devtoolshub.org/${slug}`,
    };
  } else if (slug === "json-format") {
    seoData = {
      title: "JSON Formatter - จัดระเบียบและอ่าน JSON ได้ง่าย",
      description: "เครื่องมือช่วยจัดระเบียบ JSON ให้เป็นระเบียบ และอ่านข้อมูล JSON ได้ง่ายขึ้น",
      url: `https://www.devtoolshub.org/${slug}`,
    };
  } else if (slug === "json-format-vertical") {
    seoData = {
      title: "JSON Formatter Vertical - มุมมองแนวตั้ง",
      description: "เครื่องมือ JSON Formatter แบบแนวตั้ง สำหรับดูข้อมูล JSON ในมุมมองใหม่",
      url: `https://www.devtoolshub.org/${slug}`,
    };
  } else if (slug === "xml-to-json") {
    seoData = {
      title: "XML to JSON Converter - แปลง XML เป็น JSON",
      description: "เครื่องมือแปลงไฟล์ XML ให้เป็น JSON ได้ง่ายและรวดเร็ว",
      url: `https://www.devtoolshub.org/${slug}`,
    };
  } else if (slug === "xml-to-json-vertical") {
    seoData = {
      title: "XML to JSON Converter - แปลง XML เป็น JSON",
      description: "เครื่องมือแปลงไฟล์ XML ให้เป็น JSON ได้ง่ายและรวดเร็ว",
      url: `https://www.devtoolshub.org/${slug}`,
    };
  } else if (slug === "qr-code-generator") {
    seoData = {
      title: "QR Code Generator - สร้าง QR Code ฟรี",
      description: "เครื่องมือสร้าง QR Code พร้อมปรับแต่งและดาวน์โหลดได้ฟรี",
      url: `https://www.devtoolshub.org/${slug}`,
    };
  } else if (slug === "component-a") {
    seoData = {
      title: "Component A - ตัวอย่าง Component",
      description: "Component ตัวอย่างที่แสดงฟีเจอร์เฉพาะสำหรับหน้านี้",
      url: `https://www.devtoolshub.org/${slug}`,
    };
  } else {
    seoData = {
      title: "DevToolsHub - เครื่องมือสำหรับนักพัฒนา",
      description: "รวมเครื่องมือฟรีสำหรับนักพัฒนา เช่น JSON Formatter, PHP Unserialize และอื่นๆ",
      url: `https://www.devtoolshub.org`,
    };
  }

  return {
    props: { seoData },
  };
};

export default SlugPage;
