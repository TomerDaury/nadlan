import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Property images from Supabase Storage (public bucket).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/property-images/**" },
    ],
  },
  async headers() {
    // Personal links carry the access token in the URL: never send it on as a referrer (ARCHITECTURE §2.7).
    return [{ source: "/r/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] }];
  },
  async redirects() {
    // The admin entry point is the properties screen.
    return [{ source: "/admin", destination: "/admin/properties", permanent: false }];
  },
};

export default nextConfig;
