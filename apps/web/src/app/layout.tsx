import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import {
  Fraunces,
  Literata,
  Nunito_Sans,
  Outfit,
  Source_Sans_3,
} from "next/font/google";
import { AuthProvider } from "@/components/AuthModal";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { CreateActionMenu } from "@/components/CreateActionMenu";
import { PortalShell } from "@/components/PortalShell";
import { PreferencesProvider } from "@/components/PreferencesProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { VisitTelemetry } from "@/components/VisitTelemetry";
import {
  BRAND_SUPPORT,
  BRAND_TAGLINE,
  PUBLIC_LAUNCH_LABEL,
} from "@/lib/launch";
import { sys, templates } from "@/lib/config";
import { AD_CONFIG } from "@/config/ads";
import { DEFAULT_THEME_ID, THEME_STORAGE_KEY } from "@/lib/themes";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const site =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const brand = templates.brand();
const paths = sys.paths();

/** Apply saved theme before paint to avoid flash. */
const themeBootScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var d=${JSON.stringify(DEFAULT_THEME_ID)};var ok=["brand-day","brand-warm","brand-night","monsoon","ember-graphite"];var t=localStorage.getItem(k);document.documentElement.setAttribute("data-theme",ok.indexOf(t)>=0?t:d);}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(DEFAULT_THEME_ID)});}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description: `${BRAND_TAGLINE}. ${BRAND_SUPPORT} Public launch ${PUBLIC_LAUNCH_LABEL}.`,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: paths.brandFavicon, type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: paths.brandFavicon, sizes: "180x180" }],
  },
  openGraph: {
    title: brand.name,
    description: `${BRAND_TAGLINE}. ${BRAND_SUPPORT}`,
    url: site,
    siteName: brand.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: paths.brandLogoSolid,
        width: 1254,
        height: 1254,
        alt: brand.name,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: brand.name,
    description: `${BRAND_TAGLINE}. ${BRAND_SUPPORT}`,
    images: [paths.brandLogoSolid],
  },
  ...(AD_CONFIG.publisherId
    ? {
        other: {
          "google-adsense-account": AD_CONFIG.publisherId,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#02274B",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME_ID}
      className={`${fraunces.variable} ${literata.variable} ${sourceSans.variable} ${nunito.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="surface-grain min-h-full overflow-x-hidden antialiased">
        <AdSenseScript />
        <ThemeProvider>
          <AuthProvider>
            <PreferencesProvider>
              <Suspense fallback={null}>
                <VisitTelemetry />
              </Suspense>
              <Suspense fallback={null}>
                <PortalShell>{children}</PortalShell>
              </Suspense>
              <CreateActionMenu />
            </PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
