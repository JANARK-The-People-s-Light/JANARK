import { redirect } from "next/navigation";
import { PORTAL_BASE } from "@/lib/paths";

/** Legacy /demands → /petitions */
export default function DemandsRedirect() {
  redirect(`${PORTAL_BASE}/petitions`);
}
