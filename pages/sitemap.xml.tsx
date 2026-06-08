import type { GetServerSideProps } from "next";
import { SITE, getIndexableSlugs } from "../const/seo";

// Served at /sitemap.xml — generated from the central SEO config,
// so new tools appear automatically.
function generateSitemap(): string {
  const today = new Date().toISOString().split("T")[0];

  const urls = [
    { loc: SITE.url, priority: "1.0", changefreq: "daily" },
    ...getIndexableSlugs().map((slug) => ({
      loc: `${SITE.url}/${slug}`,
      priority: "0.8",
      changefreq: "weekly",
    })),
  ];

  const body = urls
    .map(
      ({ loc, priority, changefreq }) =>
        `  <url>\n` +
        `    <loc>${loc}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${changefreq}</changefreq>\n` +
        `    <priority>${priority}</priority>\n` +
        `  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(generateSitemap());
  res.end();
  return { props: {} };
};

// Never rendered — getServerSideProps writes the response directly.
export default function Sitemap() {
  return null;
}
