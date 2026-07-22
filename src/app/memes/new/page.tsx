import { redirect } from "next/navigation";
import { portalHref } from "@/lib/paths";

/** Meme create is retired — keep route for old links. */
export default function NewMemePage() {
  redirect(portalHref("/"));
}
