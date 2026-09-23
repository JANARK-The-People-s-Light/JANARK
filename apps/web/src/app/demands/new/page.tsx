import { redirect } from "next/navigation";
import { PORTAL_BASE } from "@/lib/paths";

export default function NewDemandRedirect() {
  redirect(`${PORTAL_BASE}/petitions/new`);
}
