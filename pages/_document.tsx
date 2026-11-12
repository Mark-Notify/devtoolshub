import { Html, Head, Main, NextScript } from "next/document";
import { SITE } from "../const/seo";

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content={SITE.themeColor} />
        <meta name="application-name" content={SITE.name} />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="alternate" type="application/rss+xml" title={SITE.name} href="/sitemap.xml" />
      </Head>
      <body>
        {/* Apply the saved theme + layout template before first paint so pages don't flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var d=document.documentElement;d.setAttribute("data-theme",t);var s=localStorage,u=s.getItem("ui-template");if(!s.getItem("ui-onboarded"))u=(u==="glass"||!s.getItem("theme"))?"glass":"classic";d.setAttribute("data-ui",u==="glass"?"glass":"classic")}catch(e){}`,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
