import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const LEVELS = new Set([
  "village",
  "town",
  "city",
  "block",
  "district",
  "state",
  "national",
  "country",
  "nation",
]);

function normalizeLevel(level: string | null) {
  if (!level) return null;
  if (level === "nation") return "national";
  return LEVELS.has(level) ? level : null;
}

function reportLocationLabel(r: {
  village: string | null;
  town: string | null;
  city: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  country: string;
}) {
  return [r.village, r.town, r.city, r.block, r.district, r.state, r.country]
    .filter(Boolean)
    .join(", ");
}

function proposalLocationLabel(p: {
  town: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
}) {
  return [p.town, p.city, p.district, p.state, p.country]
    .filter(Boolean)
    .join(", ");
}

function unique(arr: string[]) {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function includes(value: string | null, needle: string) {
  if (!value) return false;
  return value.toLowerCase().includes(needle.toLowerCase());
}

/** Cascading location browse: problems, issues, votes by town/city/district/state/nation */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "all";
  const level = normalizeLevel(searchParams.get("level"));
  const country = searchParams.get("country") || "";
  const state = searchParams.get("state") || "";
  const district = searchParams.get("district") || "";
  const city = searchParams.get("city") || "";
  const town = searchParams.get("town") || "";
  const village = searchParams.get("village") || "";
  const q = searchParams.get("q") || "";
  const facetsOnly = searchParams.get("facets") === "1";

  const hasLocalScope = !!(state || district || city || town || village);

  // Facets from reports + demands
  const [allReports, allDemands] = await Promise.all([
    prisma.citizenReport.findMany({
      select: {
        country: true,
        state: true,
        district: true,
        city: true,
        town: true,
        village: true,
      },
    }),
    prisma.publicDemand.findMany({
      select: {
        country: true,
        state: true,
        district: true,
        city: true,
        town: true,
        village: true,
      },
    }),
  ]);

  const allPlaces = [...allReports, ...allDemands];

  const countries = unique(
    allPlaces.map((r) => r.country).filter(Boolean) as string[],
  );
  const states = unique(
    allPlaces
      .filter((r) => !country || includes(r.country, country))
      .map((r) => r.state)
      .filter(Boolean) as string[],
  );
  const districts = unique(
    allPlaces
      .filter(
        (r) =>
          (!country || includes(r.country, country)) &&
          (!state || includes(r.state, state)),
      )
      .map((r) => r.district)
      .filter(Boolean) as string[],
  );
  const cities = unique(
    allPlaces
      .filter(
        (r) =>
          (!state || includes(r.state, state)) &&
          (!district || includes(r.district, district)),
      )
      .map((r) => r.city)
      .filter(Boolean) as string[],
  );
  const towns = unique(
    allPlaces
      .filter(
        (r) =>
          (!state || includes(r.state, state)) &&
          (!district || includes(r.district, district)) &&
          (!city || includes(r.city, city)),
      )
      .map((r) => r.town)
      .filter(Boolean) as string[],
  );
  const villages = unique(
    allPlaces
      .filter(
        (r) =>
          (!state || includes(r.state, state)) &&
          (!district || includes(r.district, district)),
      )
      .map((r) => r.village)
      .filter(Boolean) as string[],
  );

  if (facetsOnly) {
    return NextResponse.json({
      facets: { countries, states, districts, cities, towns, villages },
    });
  }

  const reportTypeFilter =
    kind === "crime"
      ? { type: "crime" as const }
      : kind === "problems"
        ? { type: { in: ["problem", "other"] } }
        : kind === "issues"
          ? { type: "issue" as const }
          : {};

  const includeReports = kind !== "votes" && kind !== "demands";
  const includeVotes = kind === "all" || kind === "votes";

  const [reports, proposals, policyIssues, demands] = await Promise.all([
    includeReports
      ? prisma.citizenReport.findMany({
          where: {
            ...reportTypeFilter,
            ...(country ? { country: { contains: country } } : {}),
            ...(state ? { state: { contains: state } } : {}),
            ...(district ? { district: { contains: district } } : {}),
            ...(city ? { city: { contains: city } } : {}),
            ...(town ? { town: { contains: town } } : {}),
            ...(village ? { village: { contains: village } } : {}),
            ...(level ? { locationLevel: level } : {}),
            ...(q
              ? {
                  OR: [
                    { title: { contains: q } },
                    { body: { contains: q } },
                    { city: { contains: q } },
                    { town: { contains: q } },
                    { village: { contains: q } },
                    { district: { contains: q } },
                    { state: { contains: q } },
                  ],
                }
              : {}),
          },
          orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
          take: 60,
        })
      : Promise.resolve([]),
    includeVotes
      ? prisma.proposal.findMany({
          where: hasLocalScope
            ? {
                ...(country ? { country: { contains: country } } : {}),
                ...(state ? { state: { contains: state } } : {}),
                ...(district ? { district: { contains: district } } : {}),
                ...(city ? { city: { contains: city } } : {}),
                ...(town ? { town: { contains: town } } : {}),
                ...(level ? { locationLevel: level } : {}),
                ...(q
                  ? {
                      OR: [
                        { title: { contains: q } },
                        { description: { contains: q } },
                      ],
                    }
                  : {}),
              }
            : {
                OR: [
                  { locationLevel: null },
                  { locationLevel: "national" },
                  { locationLevel: "country" },
                  ...(state ? [{ state: { contains: state } }] : []),
                ],
                ...(q
                  ? {
                      AND: [
                        {
                          OR: [
                            { title: { contains: q } },
                            { description: { contains: q } },
                          ],
                        },
                      ],
                    }
                  : {}),
              },
          orderBy: { totalVotes: "desc" },
          take: 40,
        })
      : Promise.resolve([]),
    kind === "all" || kind === "issues"
      ? prisma.issue.findMany({
          orderBy: { voteCount: "desc" },
          take: hasLocalScope ? 0 : 20,
        })
      : Promise.resolve([]),
    kind === "all" || kind === "demands"
      ? prisma.publicDemand.findMany({
          where: {
            ...(country ? { country: { contains: country } } : {}),
            ...(state ? { state: { contains: state } } : {}),
            ...(district ? { district: { contains: district } } : {}),
            ...(city ? { city: { contains: city } } : {}),
            ...(town ? { town: { contains: town } } : {}),
            ...(village ? { village: { contains: village } } : {}),
            ...(level ? { locationLevel: level } : {}),
            ...(q
              ? {
                  OR: [
                    { title: { contains: q } },
                    { body: { contains: q } },
                    { ask: { contains: q } },
                  ],
                }
              : {}),
          },
          orderBy: [{ supportCount: "desc" }, { createdAt: "desc" }],
          take: 40,
        })
      : Promise.resolve([]),
  ]);

  const items = [
    ...reports.map((r) => ({
      kind:
        r.type === "issue"
          ? ("issue" as const)
          : r.type === "crime"
            ? ("crime" as const)
            : ("problem" as const),
      id: r.id,
      title: r.title,
      excerpt: r.body.slice(0, 180),
      href: `/reports/${r.id}`,
      locationLabel: reportLocationLabel(r),
      locationLevel: r.locationLevel,
      upvotes: r.upvotes,
      meta: `${r.type} · ↑ ${r.upvotes}`,
      createdAt: r.createdAt,
    })),
    ...demands.map((d) => ({
      kind: "demand" as const,
      id: d.id,
      title: d.title,
      excerpt: d.ask.slice(0, 180),
      href: `/demands/${d.id}`,
      locationLabel: reportLocationLabel(d),
      locationLevel: d.locationLevel,
      upvotes: d.supportCount,
      meta: `demand · ${d.supportCount} supporters · ${d.status}`,
      createdAt: d.createdAt,
    })),
    ...proposals.map((p) => ({
      kind: "vote" as const,
      id: p.id,
      title: p.title,
      excerpt: p.description.slice(0, 180),
      href: `/vote/${p.id}`,
      locationLabel: proposalLocationLabel(p) || "India · Nation",
      locationLevel: p.locationLevel || "national",
      upvotes: p.totalVotes,
      meta: `vote · ${p.totalVotes} ballots`,
      createdAt: p.createdAt,
    })),
    ...policyIssues.map((i) => ({
      kind: "issue" as const,
      id: i.slug,
      title: i.title,
      excerpt: i.summary.slice(0, 180),
      href: `/issues/${i.slug}`,
      locationLabel: "India · Nation",
      locationLevel: "national",
      upvotes: i.voteCount,
      meta: `policy · ${i.category}`,
      createdAt: i.createdAt,
    })),
  ].sort((a, b) => b.upvotes - a.upvotes);

  return NextResponse.json({
    facets: { countries, states, districts, cities, towns, villages },
    filter: {
      kind,
      level,
      country,
      state,
      district,
      city,
      town,
      village,
      q,
    },
    counts: {
      problems: items.filter((i) => i.kind === "problem" || i.kind === "crime")
        .length,
      issues: items.filter((i) => i.kind === "issue").length,
      votes: items.filter((i) => i.kind === "vote").length,
      demands: items.filter((i) => i.kind === "demand").length,
      total: items.length,
    },
    items,
  });
}
