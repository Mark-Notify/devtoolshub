import { Html, Head, Main, NextScript } from "next/document";
import { SITE } from "../const/seo";

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content={SITE.themeColor} />
        <meta name="application-name" content={SITE.name} />
        <link rel="icon" href="/devtools-logo.png" />
        <link rel="apple-touch-icon" href="/devtools-logo.png" />
        <link rel="alternate" type="application/rss+xml" title={SITE.name} href="/sitemap.xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
