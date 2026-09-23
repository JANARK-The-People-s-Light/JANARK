import type { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { fill, templates } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const brand = templates.brand();
const pulse = templates.portal();

export const metadata: Metadata = {
  title: fill("{title} · {name}", {
    title: pulse.pulseTitle,
    name: brand.name,
  }),
  description: pulse.pulseIntro,
};

export default function DashboardPage() {
  return <DashboardClient />;
}
