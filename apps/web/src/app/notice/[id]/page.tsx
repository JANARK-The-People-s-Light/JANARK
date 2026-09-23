import type { Metadata } from "next";
import { NoticeView } from "@/components/NoticeView";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Notice ${id.slice(0, 8)}` };
}

export default async function NoticePage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <NoticeView id={id} />
    </div>
  );
}
