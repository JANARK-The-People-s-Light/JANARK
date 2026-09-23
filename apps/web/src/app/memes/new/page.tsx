import type { Metadata } from "next";
import { CreateMemeComposer } from "@/components/CreateMemeComposer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Post a meme",
};

export default function NewMemePage() {
  return <CreateMemeComposer />;
}
