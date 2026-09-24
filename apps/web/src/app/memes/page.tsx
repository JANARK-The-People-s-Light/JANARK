import type { Metadata } from "next";
import { MemesBrowse } from "@/components/MemesBrowse";
import { BRAND_TAGLINE } from "@/lib/launch";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Memes",
  description: `Civic memes on Janark — ${BRAND_TAGLINE}`,
};

export default function MemesPage() {
  return <MemesBrowse />;
}
