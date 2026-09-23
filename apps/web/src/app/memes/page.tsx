import type { Metadata } from "next";
import { MemesBrowse } from "@/components/MemesBrowse";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Memes",
  description: "Civic memes on Janark — India's first open source social platform.",
};

export default function MemesPage() {
  return <MemesBrowse />;
}
