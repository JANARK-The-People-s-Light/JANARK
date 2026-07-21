import { redirect } from "next/navigation";
import { PORTAL_BASE } from "@/lib/paths";

type Props = { params: Promise<{ id: string }> };

export default async function DemandDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`${PORTAL_BASE}/petitions/${id}`);
}
