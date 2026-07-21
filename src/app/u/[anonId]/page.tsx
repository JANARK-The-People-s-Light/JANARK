import type { Metadata } from "next";
import { ProfileView } from "@/components/ProfileView";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = { params: Promise<{ anonId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { anonId } = await params;
  return {
    title: `Anon ${anonId}`,
    description: `Anonymous Janark profile ${anonId} — posts and reactions only. No phone number is shown.`,
  };
}

export default async function AnonProfilePage({ params }: Props) {
  const { anonId } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <ProfileView anonId={anonId.toLowerCase()} />
    </div>
  );
}
