import Head from "next/head";
import { SITE } from "../const/seo";

export type SeoProps = {
  title: string;
  description: string;
  url: string;
  canonical?: string;
  keywords?: string[];
  /** override social image (absolute or root-relative) */
  image?: string;
  /** set false on pages that should not be indexed */
  index?: boolean;
  /** is this page one of the tools (renders SoftwareApplication schema) */
  isTool?: boolean;
};

const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`;

/**
 * One component that emits every meta tag crawlers and social platforms need:
 * title/description/keywords, canonical, Open Graph, Twitter Card, robots,
 * and JSON-LD structured data.
 */
export default function Seo({
  title,
  description,
  url,
  canonical,
  keywords = [],
  image = SITE.ogImage,
  index = true,
  isTool = false,
}: SeoProps) {
  const ogImage = abs(image);
  const robots = index
    ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    : "noindex, follow";

  const structured: Record<string, unknown>[] = [];

  // Tool pages → SoftwareApplication (free web tool). Home → WebSite + SearchAction.
  if (isTool) {
    structured.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: title,
      description,
      url,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (Web)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    });
    structured.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
        { "@type": "ListItem", position: 2, name: title, item: url },
      ],
    });
  } else {
    structured.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      description,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.url}/{search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical || url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE.name} — ${title}`} />
      <meta property="og:locale" content={SITE.locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE.twitter} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {structured.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </Head>
  );
}
