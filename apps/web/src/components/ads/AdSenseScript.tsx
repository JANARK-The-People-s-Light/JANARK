import Script from "next/script";
import { AD_CONFIG } from "@/config/ads";

/**
 * Mount once in root layout. Slot components only register units.
 */
export function AdSenseScript() {
  const provider = AD_CONFIG.providers.adsense;
  const allowScript =
    AD_CONFIG.enabled &&
    Boolean(AD_CONFIG.publisherId) &&
    provider?.enabled &&
    (!AD_CONFIG.isDev || AD_CONFIG.loadScriptInDev);

  if (!allowScript || !provider.scriptUrlTemplate) {
    return null;
  }

  const src = provider.scriptUrlTemplate.replace(
    "{publisherId}",
    AD_CONFIG.publisherId,
  );

  return (
    <Script
      id="adsense-init"
      async
      src={src}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
