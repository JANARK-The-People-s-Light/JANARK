/**
 * End-to-end smoke: pages + public APIs + OTP auth gate.
 * Run against a live server: npx tsx scripts/validate-smoke.ts
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const PORTAL = "/unreleased";

type Row = { name: string; ok: boolean; detail: string };

const pages = [
  "/",
  `${PORTAL}`,
  `${PORTAL}/feed`,
  `${PORTAL}/issues`,
  `${PORTAL}/petitions`,
  `${PORTAL}/demands`,
  `${PORTAL}/reports`,
  `${PORTAL}/vote`,
  `${PORTAL}/memes`,
  `${PORTAL}/explore`,
  `${PORTAL}/dashboard`,
  `${PORTAL}/login`,
  `${PORTAL}/settings`,
  `${PORTAL}/about`,
  `${PORTAL}/terms`,
  `${PORTAL}/feed/new`,
  `${PORTAL}/issues/new`,
  `${PORTAL}/petitions/new`,
  `${PORTAL}/reports/new`,
  `${PORTAL}/vote/new`,
  `${PORTAL}/share/new`,
  `${PORTAL}/notice`,
  `${PORTAL}/notice/new`,
  `${PORTAL}/memes`,
  `${PORTAL}/memes/new`,
];

const getApis: { path: string; expect?: number | number[] }[] = [
  { path: "/api/feed" },
  { path: "/api/issues" },
  { path: "/api/demands" },
  { path: "/api/reports" },
  { path: "/api/proposals" },
  { path: "/api/shares" },
  { path: "/api/notices" },
  { path: "/api/memes" },
  { path: "/api/discussions" },
  { path: "/api/hashtags" },
  { path: "/api/explore" },
  { path: "/api/dashboard" },
  { path: "/api/auth/me", expect: [200, 401] },
  { path: "/api/preferences", expect: [200, 401] },
  { path: "/api/votes/me", expect: [200, 400, 401] },
  { path: "/api/follow", expect: [200, 400, 401] },
];

async function hit(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; json?: unknown; text: string }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: "manual",
    headers: {
      Accept: "application/json,text/html,*/*",
      Origin: BASE,
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, json, text: text.slice(0, 200) };
}

function okStatus(status: number, expect?: number | number[]) {
  if (!expect) return status >= 200 && status < 400;
  const list = Array.isArray(expect) ? expect : [expect];
  return list.includes(status);
}

async function main() {
  const rows: Row[] = [];

  for (const p of pages) {
    try {
      const r = await hit(p);
      // middleware may 307 to /unreleased/...
      const ok =
        (r.status >= 200 && r.status < 400) ||
        r.status === 307 ||
        r.status === 308;
      rows.push({
        name: `PAGE ${p}`,
        ok,
        detail: `HTTP ${r.status}`,
      });
    } catch (e) {
      rows.push({ name: `PAGE ${p}`, ok: false, detail: String(e) });
    }
  }

  for (const a of getApis) {
    try {
      const r = await hit(a.path);
      const ok = okStatus(r.status, a.expect);
      rows.push({
        name: `GET ${a.path}`,
        ok,
        detail: `HTTP ${r.status}${typeof r.json === "object" && r.json && "error" in (r.json as object) ? ` error=${(r.json as { error?: string }).error}` : ""}`,
      });
    } catch (e) {
      rows.push({ name: `GET ${a.path}`, ok: false, detail: String(e) });
    }
  }

  // Unauthenticated write must be rejected
  try {
    const r = await hit("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({
        title: "smoke",
        body: "should fail",
        website: "",
      }),
    });
    const ok = r.status === 401 || r.status === 403 || r.status === 400;
    rows.push({
      name: "WRITE gate POST /api/feed (anon)",
      ok,
      detail: `HTTP ${r.status} (expect 4xx)`,
    });
  } catch (e) {
    rows.push({
      name: "WRITE gate POST /api/feed (anon)",
      ok: false,
      detail: String(e),
    });
  }

  // OTP request should work in demo mode (or return structured error)
  try {
    const r = await hit("/api/auth/phone/request", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({
        phone: "+919999999990",
        website: "",
      }),
    });
    const ok =
      r.status === 200 ||
      r.status === 429 ||
      r.status === 400 ||
      r.status === 403;
    const hasDevOtp =
      typeof r.json === "object" &&
      r.json &&
      ("devOtp" in (r.json as object) || "ok" in (r.json as object));
    rows.push({
      name: "AUTH OTP request",
      ok,
      detail: `HTTP ${r.status}${hasDevOtp ? " (structured)" : ""} ${typeof r.json === "object" ? JSON.stringify(r.json).slice(0, 120) : r.text.slice(0, 80)}`,
    });
  } catch (e) {
    rows.push({ name: "AUTH OTP request", ok: false, detail: String(e) });
  }

  // Feed shape
  try {
    const r = await hit("/api/feed");
    const j = r.json as { items?: unknown[]; posts?: unknown[] } | undefined;
    const list = j?.items ?? j?.posts;
    const ok = r.status === 200 && Array.isArray(list);
    rows.push({
      name: "FEED shape",
      ok,
      detail: ok
        ? `items=${(list as unknown[]).length}`
        : `HTTP ${r.status} keys=${j ? Object.keys(j).join(",") : "none"}`,
    });
  } catch (e) {
    rows.push({ name: "FEED shape", ok: false, detail: String(e) });
  }

  // Detail deep-links: pick first ids from list APIs
  for (const [listPath, idKey, detailPrefix, apiDetail] of [
    ["/api/demands", "id", `${PORTAL}/petitions`, "/api/demands"],
    ["/api/reports", "id", `${PORTAL}/reports`, "/api/reports"],
    ["/api/issues", "slug", `${PORTAL}/issues`, "/api/issues"],
    ["/api/proposals", "id", `${PORTAL}/vote`, "/api/votes"],
  ] as const) {
    try {
      const r = await hit(listPath);
      const j = r.json as Record<string, unknown>;
      const arr =
        (j.items as Record<string, unknown>[] | undefined) ||
        (j.demands as Record<string, unknown>[] | undefined) ||
        (j.reports as Record<string, unknown>[] | undefined) ||
        (j.issues as Record<string, unknown>[] | undefined) ||
        (j.proposals as Record<string, unknown>[] | undefined) ||
        [];
      if (!Array.isArray(arr) || arr.length === 0) {
        rows.push({
          name: `DETAIL from ${listPath}`,
          ok: true,
          detail: "empty list (skip)",
        });
        continue;
      }
      const key = String(arr[0][idKey] ?? "");
      if (!key) {
        rows.push({
          name: `DETAIL from ${listPath}`,
          ok: false,
          detail: `missing ${idKey}`,
        });
        continue;
      }
      const page = await hit(`${detailPrefix}/${key}`);
      const api = await hit(`${apiDetail}/${key}`);
      const ok =
        page.status >= 200 &&
        page.status < 400 &&
        api.status >= 200 &&
        api.status < 400;
      rows.push({
        name: `DETAIL ${detailPrefix}/${key}`,
        ok,
        detail: `page=${page.status} api=${api.status}`,
      });
    } catch (e) {
      rows.push({
        name: `DETAIL from ${listPath}`,
        ok: false,
        detail: String(e),
      });
    }
  }

  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name} — ${r.detail}`);
  }
  console.log(
    `\n${rows.length - failed.length}/${rows.length} passed, ${failed.length} failed`,
  );
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
