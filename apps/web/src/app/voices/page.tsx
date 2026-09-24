import type { Metadata } from "next";
import { VoicesBrowse } from "@/components/VoicesBrowse";
import { templates } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: templates.portal().voicesPageTitle,
  description: templates.portal().voicesPageSubtitle,
};

export default function VoicesPage() {
  return <VoicesBrowse />;
}
