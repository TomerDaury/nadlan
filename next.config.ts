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
    // Personal links carry the access token in the URL: never send it to another site as a
    // referrer, and never let search engines index them (ARCHITECTURE §2.7, ADR-16).
    // "same-origin" rather than "no-referrer": with no-referrer the browser sends "Origin: null"
    // on form posts, and Next.js rejects them as cross-site.
    return [
      {
        source: "/r/:path*",
        headers: [
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async redirects() {
    // The admin entry point is the properties screen.
    return [{ source: "/admin", destination: "/admin/properties", permanent: false }];
  },
};

export default nextConfig;
