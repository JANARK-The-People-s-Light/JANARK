import type { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "National Dashboard",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
