import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = "https://www.devtoolshub.org";
  
  // ฟังก์ชันเพื่อดึงวันที่ในรูปแบบที่ต้องการ
  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // เติม 0 ข้างหน้าเดือนที่เป็นเลขหลักเดียว
    const day = String(date.getDate()).padStart(2, '0'); // เติม 0 ข้างหน้าวันที่เป็นเลขหลักเดียว
    return `${year}-${month}-${day}`; // รูปแบบ: YYYY-MM-DD
  };

  const currentDate = getCurrentDate();

  // รายการคอมโพเนนต์ (slug)
  const components = [
    "json-format",
    "json-format-vertical",
    "xml-to-json",
    "xml-to-json-vertical",
    "jwt-decode",
    "qr-code-generator",
    "component-a"
  ];

  // สร้างรายการของ pages ตาม slug โดยใช้ index เพื่อกำหนด priority
  const pages = components.map((slug, index) => ({
    loc: `${baseUrl}/${slug}`,
    lastmod: currentDate,
    changefreq: "monthly", // สามารถปรับตามความถี่การอัปเดตของแต่ละหน้า
    priority: 1.0 - index * 0.1, // คำนวณ priority โดยใช้ index (จะลดลงทีละ 0.1)
  }));

  // เพิ่มหน้า tools ที่เป็นหน้าแรก
  // pages.unshift({
  //   loc: `${baseUrl}`,
  //   lastmod: currentDate,
  //   changefreq: "weekly",
  //   priority: 1.0 // หน้า tools จะมี priority สูงสุด
  // });

  // สร้าง sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map(
          (page) => `
        <url>
          <loc>${page.loc}</loc>
          <lastmod>${page.lastmod}</lastmod>
          <changefreq>${page.changefreq}</changefreq>
          <priority>${page.priority}</priority>
        </url>
      `
        )
        .join("")}
    </urlset>
  `;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).end(sitemap);
}
