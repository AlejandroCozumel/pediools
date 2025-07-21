import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'edge', // Add this for Cloudflare Pages
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "pedimath-hipaa-bucket.s3.us-east-2.amazonaws.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);