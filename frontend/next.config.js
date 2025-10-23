/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
    esmExternals: "loose",
  },
  transpilePackages: ["@suilend/sui-fe-next"],
  images: {
    remotePatterns: [
      new URL("https://d29k09wtkr1a3e.cloudfront.net/springsui/**"),
      new URL("https://d29k09wtkr1a3e.cloudfront.net/suilend/**"),
    ],
  },
};
