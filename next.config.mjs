import createNextIntlPlugin from "next-intl/plugin";
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'edge', // This should apply globally
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

export default defineCloudflareConfig(withNextIntl(nextConfig));