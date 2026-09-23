import type { Metadata } from "next";
import { NoticeForm } from "@/components/NoticeForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Raise a Notice",
};

export default function NewNoticePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <NoticeForm />
    </div>
  );
}
