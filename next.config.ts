import type { NextConfig } from "next";

const noStore = [
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, max-age=0",
  },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "mongoose",
    "mongodb",
    "mongodb-memory-server",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...noStore, ...securityHeaders],
      },
      {
        source: "/api/:path*",
        headers: [...noStore, ...securityHeaders],
      },
    ];
  },
};

export default nextConfig;
