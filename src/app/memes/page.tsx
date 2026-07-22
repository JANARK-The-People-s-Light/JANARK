import { redirect } from "next/navigation";
import { portalHref } from "@/lib/paths";

/** Community / memes browse is retired — keep route for old links. */
export default function MemesPage() {
  redirect(portalHref("/"));
}
