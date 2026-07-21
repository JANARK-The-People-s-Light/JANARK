import type { NextConfig } from "next";

const noStore = [
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, max-age=0",
  },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

const nextConfig: NextConfig = {
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
        headers: noStore,
      },
      {
        source: "/api/:path*",
        headers: noStore,
      },
    ];
  },
};

export default nextConfig;
