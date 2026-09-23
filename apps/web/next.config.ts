import { config as loadEnv } from "dotenv";
import path from "node:path";
import type { NextConfig } from "next";

// Monorepo: keep secrets in repo-root `.env` while Next runs from apps/web
loadEnv({ path: path.join(__dirname, "../../.env") });

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
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Allow importing repo-root `config/*.json` into the web app.
  experimental: {
    externalDir: true,
  },
  poweredByHeader: false,
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "mongoose",
    "mongodb",
    "mongodb-memory-server",
  ],
  async rewrites() {
    // Runtime uploads are not in the build-time public file map — serve via API.
    return [
      {
        source: "/uploads/:filename",
        destination: "/api/uploads/:filename",
      },
    ];
  },
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
