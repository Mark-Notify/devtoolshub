import "../styles/globals.css";
import Head from "next/head";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { SnackbarProvider } from "notistack";
import { SessionProvider } from "next-auth/react";
import { RecoilRoot, useRecoilSnapshot } from "recoil";

function DebugObserver(): any {
  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug("The following atoms were modified:");
    for (const node of snapshot.getNodes_UNSTABLE({ isModified: true })) {
      console.debug(node.key, snapshot.getLoadable(node));
    }
  }, [snapshot]);

  return null;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Favicon placed in public/ */}
        <link rel="icon" href="/devtools-logo.png" />
        {/* Site-wide Organization schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "DevToolsHub",
              url: "https://www.devtoolshub.org",
              logo: "https://www.devtoolshub.org/devtools-logo-full.png",
            }),
          }}
        />
      </Head>
      <DebugObserver />
      <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
        <SessionProvider session={(pageProps as any).session}>
          <Component {...pageProps} />
        </SessionProvider>
      </SnackbarProvider>
    </RecoilRoot>

  );
}

export default MyApp;
