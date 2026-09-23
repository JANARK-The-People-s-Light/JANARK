import { AD_CONFIG } from "@/config/ads";

/**
 * Serves /ads.txt for authorized digital sellers.
 * Lines come from ADS_TXT_LINES or policy defaults with publisher id substituted.
 */
export function GET() {
  const body = `${AD_CONFIG.adsTxtLines.join("\n")}\n`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
