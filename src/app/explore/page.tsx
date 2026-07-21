import { redirect } from "next/navigation";
import { PORTAL_BASE } from "@/lib/paths";

/** Explore folded into Feed to avoid a duplicate browse surface. */
export default function ExploreRedirect() {
  redirect(`${PORTAL_BASE}/feed`);
}
