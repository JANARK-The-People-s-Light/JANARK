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
  const data = await getDashboardData();
  return liveJson(data);
}
