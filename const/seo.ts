// =============================================================
// Central SEO config — single source of truth for every page.
// Edit tool metadata here; sitemap, <Seo>, and pages all read it.
// =============================================================

export const SITE = {
  name: "DevToolsHub",
  shortName: "DevToolsHub",
  url: "https://www.devtoolshub.org",
  locale: "th_TH",
  twitter: "@devtoolshub",
  // 1200x630 social share image
  ogImage: "/devtools-logo-full.png",
  themeColor: "#0f172a",
} as const;

const YEAR = new Date().getFullYear();

export type ToolSeo = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  /** include in sitemap + sidebar discovery (default true) */
  index?: boolean;
};

// Default / homepage SEO
export const DEFAULT_SEO: ToolSeo = {
  slug: "",
  title: `DevToolsHub — รวมเครื่องมือนักพัฒนาออนไลน์ฟรี 20+ ตัว (${YEAR})`,
  description:
    "DevToolsHub รวมเครื่องมือสำหรับนักพัฒนาออนไลน์ฟรี ไม่ต้องติดตั้ง — JSON Formatter, JWT Decoder, Base64, Hash, Regex Tester, URL Encode, UUID, QR Code และอีกกว่า 20 เครื่องมือ ใช้งานได้ทันทีบนเบราว์เซอร์ รวดเร็วและปลอดภัย",
  keywords: [
    "เครื่องมือนักพัฒนา",
    "developer tools",
    "online tools",
    "json formatter",
    "jwt decoder",
    "base64",
    "regex tester",
    "เครื่องมือออนไลน์ฟรี",
    "devtoolshub",
  ],
};

// Per-tool SEO. Keys are the URL slug.
export const TOOLS_SEO: Record<string, ToolSeo> = {
  "json-format": {
    slug: "json-format",
    title: "JSON Formatter & Beautifier ออนไลน์ฟรี — จัดระเบียบ JSON | DevToolsHub",
    description:
      "จัดรูปแบบ ตรวจสอบ และ beautify JSON ออนไลน์ฟรี พร้อม validate หา error ย่อ/ขยาย และคัดลอกได้ทันที ใช้งานง่ายบนเบราว์เซอร์",
    keywords: ["json formatter", "json beautifier", "json validator", "จัดรูปแบบ json", "format json online"],
  },
  "json-format-vertical": {
    slug: "json-format-vertical",
    title: "JSON Formatter (Tree View) — ดู JSON แบบโครงสร้าง | DevToolsHub",
    description:
      "JSON Formatter มุมมองแบบ tree ดูโครงสร้าง JSON ที่ซ้อนกันลึกได้ง่าย พร้อม decode ค่าซ้อนอัตโนมัติ ใช้งานฟรีบนเบราว์เซอร์",
    keywords: ["json tree view", "json viewer", "json formatter", "ดู json", "json โครงสร้าง"],
  },
  "xml-to-json": {
    slug: "xml-to-json",
    title: "XML to JSON Converter ออนไลน์ฟรี — แปลง XML เป็น JSON | DevToolsHub",
    description:
      "แปลงไฟล์ XML เป็น JSON ออนไลน์ฟรี รวดเร็ว แม่นยำ รองรับ attribute และ nested node คัดลอกผลลัพธ์ได้ทันที ไม่ต้องติดตั้ง",
    keywords: ["xml to json", "convert xml to json", "แปลง xml เป็น json", "xml converter"],
  },
  "xml-to-json-vertical": {
    slug: "xml-to-json-vertical",
    title: "XML to JSON (Tree View) — แปลงและดูแบบโครงสร้าง | DevToolsHub",
    description:
      "แปลง XML เป็น JSON พร้อมมุมมองแบบ tree ดูข้อมูลที่ซ้อนกันได้ชัดเจน ใช้งานฟรีบนเบราว์เซอร์ ไม่ต้องติดตั้ง",
    keywords: ["xml to json", "xml json tree", "แปลง xml", "xml converter online"],
  },
  "yaml-json": {
    slug: "yaml-json",
    title: "YAML ↔ JSON Converter ออนไลน์ฟรี — แปลงสองทาง | DevToolsHub",
    description:
      "แปลง YAML เป็น JSON และ JSON เป็น YAML ออนไลน์ฟรี รองรับ config ไฟล์ขนาดใหญ่ พร้อม validate และคัดลอกผลลัพธ์ได้ทันที",
    keywords: ["yaml to json", "json to yaml", "yaml converter", "แปลง yaml", "yaml json online"],
  },
  "json-to-csv": {
    slug: "json-to-csv",
    title: "JSON to CSV Converter ออนไลน์ฟรี — แปลงและดาวน์โหลด | DevToolsHub",
    description:
      "แปลง JSON Array เป็นไฟล์ CSV ออนไลน์ฟรี รองรับข้อมูลซ้อนกัน พร้อมดาวน์โหลดไฟล์ .csv ได้ทันที เปิดใน Excel / Google Sheets ได้เลย",
    keywords: ["json to csv", "convert json to csv", "แปลง json เป็น csv", "json csv download"],
  },
  "sql-formatter": {
    slug: "sql-formatter",
    title: "SQL Formatter & Beautifier ออนไลน์ฟรี — จัด Query | DevToolsHub",
    description:
      "จัดรูปแบบและ beautify SQL Query ออนไลน์ฟรี รองรับ MySQL, PostgreSQL, SQLite, SQL Server อ่านง่าย คัดลอกได้ทันที",
    keywords: ["sql formatter", "sql beautifier", "format sql online", "จัดรูปแบบ sql", "sql query formatter"],
  },
  "jwt-decode": {
    slug: "jwt-decode",
    title: "JWT Decoder ออนไลน์ฟรี — ถอดรหัสและตรวจสอบ JWT Token | DevToolsHub",
    description:
      "ถอดรหัส (decode) JWT Token ออนไลน์ฟรี ดู Header, Payload และ Signature พร้อมตรวจสอบ claim และวันหมดอายุ ปลอดภัย ประมวลผลในเบราว์เซอร์",
    keywords: ["jwt decoder", "jwt decode", "decode jwt token", "ถอดรหัส jwt", "json web token"],
  },
  base64: {
    slug: "base64",
    title: "Base64 Encode / Decode ออนไลน์ฟรี — เข้ารหัสและถอดรหัส | DevToolsHub",
    description:
      "เข้ารหัส (encode) และถอดรหัส (decode) Base64 ออนไลน์ฟรี รองรับข้อความและไฟล์ ใช้งานง่าย รวดเร็ว ประมวลผลในเบราว์เซอร์ ปลอดภัย",
    keywords: ["base64 encode", "base64 decode", "เข้ารหัส base64", "ถอดรหัส base64", "base64 online"],
  },
  "url-encode-decode": {
    slug: "url-encode-decode",
    title: "URL Encode / Decode ออนไลน์ฟรี — เข้ารหัสและถอดรหัส URL | DevToolsHub",
    description:
      "เข้ารหัสและถอดรหัส URL (percent-encoding) ออนไลน์ฟรี รองรับ query string และอักขระพิเศษ ใช้งานง่ายและรวดเร็วบนเบราว์เซอร์",
    keywords: ["url encode", "url decode", "percent encoding", "เข้ารหัส url", "url encoder online"],
  },
  "hash-generator": {
    slug: "hash-generator",
    title: "Hash Generator ออนไลน์ฟรี — MD5, SHA1, SHA256, SHA512 | DevToolsHub",
    description:
      "สร้าง Hash จากข้อความออนไลน์ฟรี รองรับ MD5, SHA1, SHA256, SHA512 ประมวลผลในเบราว์เซอร์ ปลอดภัย คัดลอกผลลัพธ์ได้ทันที",
    keywords: ["hash generator", "md5", "sha256", "sha512", "สร้าง hash", "hash online"],
  },
  "diff-checker": {
    slug: "diff-checker",
    title: "Diff Checker ออนไลน์ฟรี — เปรียบเทียบข้อความ Line-by-line | DevToolsHub",
    description:
      "เปรียบเทียบข้อความหรือโค้ด 2 ชุดแบบ line-by-line ออนไลน์ฟรี ไฮไลต์ส่วนที่เพิ่ม ลบ และแก้ไข อ่านง่าย ใช้งานทันที",
    keywords: ["diff checker", "text compare", "compare text online", "เปรียบเทียบข้อความ", "diff online"],
  },
  "regex-tester": {
    slug: "regex-tester",
    title: "Regex Tester ออนไลน์ฟรี — ทดสอบ Regular Expression | DevToolsHub",
    description:
      "ทดสอบ Regular Expression (Regex) ออนไลน์ฟรี ไฮไลต์ match และ capture group แบบเรียลไทม์ พร้อมตัวอย่าง ช่วยเขียน regex ได้เร็วขึ้น",
    keywords: ["regex tester", "regular expression", "regex online", "ทดสอบ regex", "regex match"],
  },
  "html-render": {
    slug: "html-render",
    title: "HTML Online Editor & Live Preview ฟรี — เขียน HTML เรียลไทม์ | DevToolsHub",
    description:
      "เขียน HTML, CSS และ JavaScript ออนไลน์ฟรี พร้อมแสดงผล (live preview) แบบเรียลไทม์ ทดลองโค้ดได้ทันทีบนเบราว์เซอร์ ไม่ต้องติดตั้ง",
    keywords: ["html editor online", "html live preview", "html render", "เขียน html ออนไลน์", "code playground"],
  },
  "timestamp-converter": {
    slug: "timestamp-converter",
    title: "Unix Timestamp Converter ออนไลน์ฟรี — แปลงเวลา | DevToolsHub",
    description:
      "แปลง Unix Timestamp เป็นวันที่ และแปลงวันที่เป็น Timestamp ออนไลน์ฟรี รองรับวินาที/มิลลิวินาที และเขตเวลา ใช้งานง่าย",
    keywords: ["unix timestamp converter", "epoch converter", "timestamp to date", "แปลง timestamp", "unix time"],
  },
  "uuid-generator": {
    slug: "uuid-generator",
    title: "UUID Generator ออนไลน์ฟรี — สร้าง UUID v4 แบบ Bulk | DevToolsHub",
    description:
      "สร้าง UUID v4 แบบสุ่มออนไลน์ฟรี สร้างทีละหลายตัว (bulk) ได้สูงสุด 100 รายการ คัดลอกได้ทันที สำหรับ key, id และฐานข้อมูล",
    keywords: ["uuid generator", "uuid v4", "generate uuid", "สร้าง uuid", "guid generator"],
  },
  "password-generator": {
    slug: "password-generator",
    title: "Password Generator ออนไลน์ฟรี — สร้างรหัสผ่านปลอดภัย | DevToolsHub",
    description:
      "สร้างรหัสผ่านแบบสุ่มที่ปลอดภัยและแข็งแรงออนไลน์ฟรี ปรับความยาวและชนิดอักขระได้ ประมวลผลในเบราว์เซอร์ ไม่ส่งข้อมูลออก",
    keywords: ["password generator", "strong password", "random password", "สร้างรหัสผ่าน", "secure password"],
  },
  "number-base": {
    slug: "number-base",
    title: "Number Base Converter ออนไลน์ฟรี — แปลงเลขฐาน 2/8/10/16 | DevToolsHub",
    description:
      "แปลงเลขระหว่างฐาน 2 (binary), 8 (octal), 10 (decimal) และ 16 (hex) ออนไลน์ฟรี พร้อม bit visualization เข้าใจง่าย",
    keywords: ["number base converter", "binary to decimal", "hex converter", "แปลงเลขฐาน", "decimal to binary"],
  },
  "color-converter": {
    slug: "color-converter",
    title: "Color Converter ออนไลน์ฟรี — แปลงสี HEX, RGB, HSL | DevToolsHub",
    description:
      "แปลงสีระหว่าง HEX, RGB และ HSL ออนไลน์ฟรี พร้อม color picker และตัวอย่างสีแบบเรียลไทม์ สำหรับงานดีไซน์และเว็บ",
    keywords: ["color converter", "hex to rgb", "rgb to hex", "hsl", "แปลงสี", "color picker online"],
  },
  "qr-code-generator": {
    slug: "qr-code-generator",
    title: "QR Code Generator ออนไลน์ฟรี — สร้างและดาวน์โหลด QR | DevToolsHub",
    description:
      "สร้าง QR Code ออนไลน์ฟรีจากลิงก์หรือข้อความ ปรับแต่งและดาวน์โหลดเป็นรูปภาพได้ทันที ใช้งานง่าย ไม่มีลายน้ำ",
    keywords: ["qr code generator", "สร้าง qr code", "qr code online", "generate qr code", "qr ฟรี"],
  },
  "morse-code-decoder": {
    slug: "morse-code-decoder",
    title: "Morse Code Translator ออนไลน์ฟรี — แปลรหัสมอร์ส | DevToolsHub",
    description:
      "แปลงข้อความเป็นรหัสมอร์สและถอดรหัสมอร์สเป็นข้อความออนไลน์ฟรี รองรับตัวอักษรและตัวเลข พร้อมเสียงและ animation สนุกและใช้งานง่าย",
    keywords: ["morse code translator", "morse code decoder", "แปลรหัสมอร์ส", "รหัสมอร์ส", "morse code online"],
  },
  "terms-and-conditions": {
    slug: "terms-and-conditions",
    title: "ข้อกำหนดและเงื่อนไขการใช้งาน | DevToolsHub",
    description: "ข้อกำหนดและเงื่อนไขการใช้งานเว็บไซต์ DevToolsHub",
    keywords: ["terms and conditions", "ข้อกำหนดการใช้งาน"],
    index: false,
  },
  profile: {
    slug: "profile",
    title: "โปรไฟล์ของฉัน | DevToolsHub",
    description: "จัดการโปรไฟล์และ snippet ที่บันทึกไว้บน DevToolsHub",
    keywords: ["profile", "โปรไฟล์"],
    index: false,
  },
};

/** Resolve SEO data for a slug, with absolute URL + canonical. */
export function getSeo(slug?: string | string[] | null) {
  const key = Array.isArray(slug) ? slug[0] : slug;
  const base = (key && TOOLS_SEO[key]) || DEFAULT_SEO;
  const path = base.slug ? `/${base.slug}` : "/";
  return {
    ...base,
    url: `${SITE.url}${path}`,
    canonical: `${SITE.url}${path}`,
  };
}

/** All tool slugs that should be indexed (sitemap / internal linking). */
export function getIndexableSlugs(): string[] {
  return Object.values(TOOLS_SEO)
    .filter((t) => t.index !== false)
    .map((t) => t.slug);
}
