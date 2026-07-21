import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/AuthModal";
import { CreateActionMenu } from "@/components/CreateActionMenu";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { VisitTelemetry } from "@/components/VisitTelemetry";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const site =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Janark — The light for us, by us",
    template: "%s · Janark",
  },
  description:
    "The light for us, by us. A non-profit civic organisation — independent of government and parties. Just a unified voice.",
  icons: {
    icon: [{ url: "/logo/janark.png", type: "image/png" }],
    apple: [{ url: "/logo/janark.png" }],
  },
  openGraph: {
    title: "Janark — The light for us, by us",
    description:
      "A non-profit civic organisation — independent of government and parties. Just a unified voice.",
    url: site,
    siteName: "Janark",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/logo/janark-solid.png", width: 1254, height: 1254, alt: "Janark" }],
  },
  twitter: {
    card: "summary",
    title: "Janark — The light for us, by us",
    description:
      "A non-profit civic organisation — independent of government and parties. Just a unified voice.",
    images: ["/logo/janark-solid.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1f3a",
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
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="surface-grain flex min-h-full flex-col overflow-x-hidden">
        <AuthProvider>
          <Suspense fallback={null}>
            <VisitTelemetry />
          </Suspense>
          <SiteHeader />
          <main className="min-w-0 flex-1">{children}</main>
          <SiteFooter />
          <CreateActionMenu />
        </AuthProvider>
      </body>
    </html>
  );
}
