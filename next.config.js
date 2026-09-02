// next.config.js
module.exports = {
  images: {
    domains: ["picsum.photos"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // The qpdf WASM glue (lib/pdfUnlock.ts) has Node-only branches that are
      // never taken in the browser — stub the modules they reference.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        process: false,
      };
    }
    return config;
  },
};
