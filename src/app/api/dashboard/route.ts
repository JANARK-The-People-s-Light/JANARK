import { getDashboardData, getLiveStats } from "@/lib/services";
import { liveJson } from "@/lib/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("statsOnly") === "1") {
    const stats = await getLiveStats();
    return liveJson({ stats });
  }

  const data = await getDashboardData({
    country: searchParams.get("country")?.trim() || undefined,
    state: searchParams.get("state")?.trim() || undefined,
    district: searchParams.get("district")?.trim() || undefined,
    city: searchParams.get("city")?.trim() || undefined,
    tag: searchParams.get("tag")?.trim() || undefined,
    q: searchParams.get("q")?.trim() || undefined,
    kind: searchParams.get("kind")?.trim() || undefined,
  });
  return liveJson(data);
}
