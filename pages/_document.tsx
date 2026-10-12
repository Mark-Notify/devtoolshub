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
        {/* Apply the saved theme before first paint so pages don't flash light → dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
