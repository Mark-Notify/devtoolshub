import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Jwtdecode from "../components/Jwt/Jwtdecode";
import QRCodeGen from "../components/QRCode/QRCodeGen";
import JsonToXml from "../components/JsonFormat/JsonToXml";
import JsonToXmlVertical from "../components/JsonFormat/JsonToXmlVertical";
import JsonFormat from "../components/JsonFormat/JsonFormat";
import JsonFormatVertical from "../components/JsonFormat/JsonFormatVertical";
import ProfilePage from "../components/ProfilePage";
import CommonLayout from "../components/Layout";
import TermsAndConditions from "../components/terms-and-conditions";
import Base64 from "../components/base64";
import MorseCode from "../components/MorseCode";
import HtmlEditorPage from "../components/HtmlEditor";
import UrlEncodeDecode from "../components/UrlEncodeDecode";
import HashGenerator from "../components/HashGenerator";
import DiffChecker from "../components/DiffChecker";
import TimestampConverter from "../components/TimestampConverter";
import YamlJson from "../components/YamlJson";
import RegexTester from "../components/RegexTester";
import UuidGenerator from "../components/UuidGenerator";
import SqlFormatter from "../components/SqlFormatter";
import JsonToCsv from "../components/JsonToCsv";
import ColorConverter from "../components/ColorConverter";
import PasswordGenerator from "../components/PasswordGenerator";
import NumberBase from "../components/NumberBase";

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
        case "base64":
          setSeoData({
            title: "Base64 Encode/Decode - เข้ารหัสและถอดรหัส Base64 ออนไลน์",
            description: "เครื่องมือเข้ารหัส (Encode) และถอดรหัส (Decode) ข้อความด้วย Base64 ฟรี ใช้ง่ายและรวดเร็ว",
            url: "https://www.devtoolshub.org/base64",
          });
          break;
        case "morse-code-decoder":
          setSeoData({
            title: "Morse Code Decoder - แปลงรหัสมอร์สเป็นข้อความ | DevToolsHub",
            description:
              "แปลงรหัสมอร์สเป็นข้อความหรือข้อความเป็นรหัสมอร์ส รองรับตัวอักษรภาษาอังกฤษและตัวเลข ใช้งานฟรี พร้อมเสียงและ animation",
            url: "https://www.devtoolshub.org/morse-code-decoder",
          });
          break;
        case "html-render":
          setSeoData({
            title: "HTML Online Render - เขียนและแสดงผล HTML แบบเรียลไทม์ | DevToolsHub",
            description: "เครื่องมือเขียน HTML แบบออนไลน์ พร้อมแสดงผลแบบเรียลไทม์ ใช้งานฟรี",
            url: "https://www.devtoolshub.org/html-render",
          }); break;
        case "url-encode-decode":
          setSeoData({ title: "URL Encode/Decode - เข้ารหัสและถอดรหัส URL | DevToolsHub", description: "เครื่องมือ Encode และ Decode URL ออนไลน์ฟรี", url: "https://www.devtoolshub.org/url-encode-decode" }); break;
        case "hash-generator":
          setSeoData({ title: "Hash Generator - MD5, SHA1, SHA256 | DevToolsHub", description: "สร้าง Hash ด้วย MD5, SHA1, SHA256, SHA512 ออนไลน์ฟรี", url: "https://www.devtoolshub.org/hash-generator" }); break;
        case "diff-checker":
          setSeoData({ title: "Diff Checker - เปรียบเทียบข้อความ | DevToolsHub", description: "เครื่องมือเปรียบเทียบข้อความ 2 ชิ้นแบบ line-by-line", url: "https://www.devtoolshub.org/diff-checker" }); break;
        case "timestamp-converter":
          setSeoData({ title: "Timestamp Converter - แปลง Unix Timestamp | DevToolsHub", description: "แปลง Unix Timestamp เป็น Date และกลับกัน", url: "https://www.devtoolshub.org/timestamp-converter" }); break;
        case "yaml-json":
          setSeoData({ title: "YAML ↔ JSON Converter | DevToolsHub", description: "แปลง YAML เป็น JSON หรือ JSON เป็น YAML ออนไลน์ฟรี", url: "https://www.devtoolshub.org/yaml-json" }); break;
        case "regex-tester":
          setSeoData({ title: "Regex Tester - ทดสอบ Regular Expression | DevToolsHub", description: "ทดสอบ Regex พร้อม highlight matches และ groups", url: "https://www.devtoolshub.org/regex-tester" }); break;
        case "uuid-generator":
          setSeoData({ title: "UUID Generator - สร้าง UUID v4 | DevToolsHub", description: "สร้าง UUID v4 แบบสุ่ม bulk generate ได้สูงสุด 100 ตัว", url: "https://www.devtoolshub.org/uuid-generator" }); break;
        case "sql-formatter":
          setSeoData({ title: "SQL Formatter - จัด Format SQL | DevToolsHub", description: "จัด Format SQL Query รองรับ MySQL, PostgreSQL, SQLite และอื่นๆ", url: "https://www.devtoolshub.org/sql-formatter" }); break;
        case "json-to-csv":
          setSeoData({ title: "JSON to CSV Converter | DevToolsHub", description: "แปลง JSON Array เป็น CSV พร้อม download", url: "https://www.devtoolshub.org/json-to-csv" }); break;
        case "color-converter":
          setSeoData({ title: "Color Converter - HEX RGB HSL | DevToolsHub", description: "แปลงสีระหว่าง HEX, RGB, HSL พร้อม color picker", url: "https://www.devtoolshub.org/color-converter" }); break;
        case "password-generator":
          setSeoData({ title: "Password Generator - สร้างรหัสผ่าน | DevToolsHub", description: "สร้างรหัสผ่านแบบสุ่ม ปลอดภัย ปรับแต่งได้", url: "https://www.devtoolshub.org/password-generator" }); break;
        case "number-base":
          setSeoData({ title: "Number Base Converter - แปลงเลขฐาน | DevToolsHub", description: "แปลงเลขระหว่างฐาน 2, 8, 10, 16 พร้อม bit visualization", url: "https://www.devtoolshub.org/number-base" }); break;
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
      case "base64":
        return <Base64 />;
      case "morse-code-decoder":
        return <MorseCode />;
      case "html-render":
        return <HtmlEditorPage />;
      case "url-encode-decode":
        return <UrlEncodeDecode />;
      case "hash-generator":
        return <HashGenerator />;
      case "diff-checker":
        return <DiffChecker />;
      case "timestamp-converter":
        return <TimestampConverter />;
      case "yaml-json":
        return <YamlJson />;
      case "regex-tester":
        return <RegexTester />;
      case "uuid-generator":
        return <UuidGenerator />;
      case "sql-formatter":
        return <SqlFormatter />;
      case "json-to-csv":
        return <JsonToCsv />;
      case "color-converter":
        return <ColorConverter />;
      case "password-generator":
        return <PasswordGenerator />;
      case "number-base":
        return <NumberBase />;
      case "profile":
        return <ProfilePage />;
      case "terms-and-conditions":
        return <TermsAndConditions />;
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
        <div className="flex-1 flex flex-col overflow-hidden">{renderComponent()}</div>
      </CommonLayout>
    </>
  );
};

export default SlugPage;
