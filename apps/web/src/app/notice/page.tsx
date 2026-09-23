import type { Metadata } from "next";
import { NoticesBrowse } from "@/components/NoticesBrowse";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Notices",
};

export default function NoticesPage() {
  return <NoticesBrowse />;
}
