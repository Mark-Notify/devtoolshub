// next.config.js
module.exports = {
  images: {
    domains: ["picsum.photos"],
  },

  async redirects() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
        permanent: true,
      },
    ];
  },
};
