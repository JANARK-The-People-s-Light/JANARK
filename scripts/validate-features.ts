/**
 * Feature-path validation: OTP + create/act across civic surfaces.
 * Requires running server: BASE_URL=http://localhost:3001 npx tsx scripts/validate-features.ts
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

type Row = { name: string; ok: boolean; detail: string };
const rows: Row[] = [];

function record(name: string, ok: boolean, detail: string) {
  rows.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} — ${detail}`);
}

async function req(
  path: string,
  init?: RequestInit & { cookieJar?: { cookie?: string } },
): Promise<{ status: number; json: any; setCookie?: string; text: string }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Origin: BASE,
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.cookieJar?.cookie) headers.Cookie = init.cookieJar.cookie;
  const res = await fetch(`${BASE}${path}`, { ...init, headers, redirect: "manual" });
  const setCookie = res.headers.getSetCookie?.()?.join("; ") || res.headers.get("set-cookie") || undefined;
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (setCookie && init?.cookieJar) {
    const m = /janark_sid=([^;]+)/.exec(setCookie);
    if (m) init.cookieJar.cookie = `janark_sid=${m[1]}`;
  }
  return { status: res.status, json, setCookie, text: text.slice(0, 200) };
}

async function main() {
  const jar: { cookie?: string } = {};
  const phone = `+9198${String(Date.now()).slice(-8)}`;

  // --- Auth ---
  {
    const r = await req("/api/auth/phone/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, website: "" }),
      cookieJar: jar,
    });
    const code = r.json?.devCode;
    record("OTP request", r.status === 200 && !!code, `HTTP ${r.status} code=${Boolean(code)}`);
    if (!code) {
      finish(1);
      return;
    }
    const v = await req("/api/auth/phone/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, website: "" }),
      cookieJar: jar,
    });
    record(
      "OTP verify + session",
      v.status === 200 && !!v.json?.session?.anonId && !!jar.cookie,
      `anon=${v.json?.session?.anonId ?? "none"} cookie=${Boolean(jar.cookie)}`,
    );
  }

  const terms = { acceptedTerms: true, termsVersion: "2026-07-21.3", website: "" };

  // --- Creates ---
  let feedId = "";
  let demandId = "";
  let reportId = "";
  let proposalId = "";
  let shareId = "";
  let noticeId = "";
  let issueSlug = "";
  let memeId = "";

  {
    const r = await req("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Feature check discussion",
        body: "Automated feature validation body.",
        tags: ["featurecheck"],
        ...terms,
      }),
      cookieJar: jar,
    });
    feedId = r.json?.post?.id || r.json?.discussion?.id || "";
    record("Create discussion", r.status < 400 && !!feedId, `HTTP ${r.status} id=${feedId || r.json?.error}`);
  }

  {
    const r = await req("/api/demands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Feature check petition for parks",
        body: "Validation petition with enough text for checks.",
        ask: "Maintain neighborhood parks",
        target: "Municipal Commissioner",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        locationLevel: "city",
        ...terms,
      }),
      cookieJar: jar,
    });
    demandId = r.json?.demand?.id || "";
    record("Create petition", r.status < 400 && !!demandId, `HTTP ${r.status} id=${demandId || r.json?.error}`);
  }

  {
    const r = await req("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Feature check pothole report",
        body: "Automated validation report near main road.",
        type: "problem",
        locationLevel: "city",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        ...terms,
      }),
      cookieJar: jar,
    });
    reportId = r.json?.report?.id || "";
    record("Create report", r.status < 400 && !!reportId, `HTTP ${r.status} id=${reportId || r.json?.error}`);
  }

  {
    const r = await req("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Feature check civic vote question",
        description: "Should we run this validation ballot?",
        voteType: "preference",
        options: ["Yes", "No", "Abstain"],
        ...terms,
      }),
      cookieJar: jar,
    });
    proposalId = r.json?.proposal?.id || r.json?.id || "";
    record("Create vote", r.status < 400 && !!proposalId, `HTTP ${r.status} id=${proposalId || JSON.stringify(r.json).slice(0, 80)}`);
  }

  // Real upload so share/meme media URLs resolve
  let uploadedUrl = "";
  {
    const jpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
      "base64",
    );
    const fd = new FormData();
    fd.append("file", new Blob([jpeg], { type: "image/jpeg" }), "feature-check.jpg");
    const res = await fetch(`${BASE}/api/upload`, {
      method: "POST",
      headers: { Origin: BASE, Cookie: jar.cookie || "" },
      body: fd,
    });
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    uploadedUrl = json.url || "";
    record(
      "Upload media",
      res.status === 200 && !!uploadedUrl,
      `HTTP ${res.status} url=${uploadedUrl || json.error || "none"}`,
    );
  }

  {
    const r = await req("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: "Feature check community share",
        mediaUrl: uploadedUrl || "/uploads/feature-check.jpg",
        ...terms,
      }),
      cookieJar: jar,
    });
    shareId = r.json?.share?.id || "";
    record("Create share", r.status < 400 && !!shareId, `HTTP ${r.status} id=${shareId || r.json?.error}`);
  }

  {
    const r = await req("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Feature check notice",
        description: "Public notice for validation.",
        ...terms,
      }),
      cookieJar: jar,
    });
    noticeId = r.json?.notice?.id || "";
    record("Create notice", r.status < 400 && !!noticeId, `HTTP ${r.status} id=${noticeId || r.json?.error}`);
  }

  {
    const slug = `feature-check-issue-${Date.now().toString(36)}`;
    const r = await req("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Feature check civic issue",
        summary: "Issue body for automated validation.",
        slug,
        category: "governance",
        ...terms,
      }),
      cookieJar: jar,
    });
    issueSlug = r.json?.issue?.slug || r.json?.slug || slug;
    record("Create issue", r.status < 400, `HTTP ${r.status} slug=${issueSlug} err=${r.json?.error ?? ""}`);
  }

  {
    const r = await req("/api/memes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Feature check meme",
        caption: "Feature check meme caption #janark",
        imageUrl: uploadedUrl || "/uploads/feature-check.jpg",
        tags: ["janark", "featurecheck"],
        ...terms,
      }),
      cookieJar: jar,
    });
    memeId = r.json?.meme?.id || "";
    record("Create meme", r.status < 400 && !!memeId, `HTTP ${r.status} id=${memeId || r.json?.error}`);
  }

  // --- Act ---
  if (demandId) {
    const r = await req(`/api/demands/${demandId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Feature Tester",
        postalCode: "560001",
        phone,
        website: "",
      }),
      cookieJar: jar,
    });
    record("Sign petition", r.status < 400 && r.json?.ok !== false, `HTTP ${r.status} ${r.json?.error ?? "ok"}`);
  }

  if (proposalId) {
    const r = await req(`/api/votes/${proposalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice: ["Yes"], website: "" }),
      cookieJar: jar,
    });
    record("Cast ballot", r.status < 400 && (r.json?.ok === true || r.json?.vote), `HTTP ${r.status} ${r.json?.error ?? "ok"}`);
    const me = await req(`/api/votes/me?proposalId=${encodeURIComponent(proposalId)}`, { cookieJar: jar });
    record("Votes/me", me.status === 200 && me.json?.vote, `HTTP ${me.status}`);
  }

  if (reportId) {
    const r = await req(`/api/reports/${reportId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction: "endorse", website: "" }),
      cookieJar: jar,
    });
    record("Report react", r.status < 400, `HTTP ${r.status} ${r.json?.error ?? "ok"}`);
  }

  if (noticeId) {
    const r = await req(`/api/notices/${noticeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: "" }),
      cookieJar: jar,
    });
    record("Sign notice", r.status < 400, `HTTP ${r.status} ${r.json?.error ?? "ok"}`);
  }

  const engageTarget = demandId
    ? { targetType: "demand", targetId: demandId }
    : feedId
      ? { targetType: "feed", targetId: feedId }
      : null;
  if (engageTarget) {
    const r = await req("/api/engage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...engageTarget, choice: "upvote", website: "" }),
      cookieJar: jar,
    });
    record("Engage upvote", r.status < 400 && r.json?.ok !== false, `HTTP ${r.status} ${r.json?.error ?? `score=${r.json?.score}`}`);

    const c = await req("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...engageTarget,
        body: "Feature check comment",
        ...terms,
      }),
      cookieJar: jar,
    });
    const commentId = c.json?.comment?.id || c.json?.comments?.[0]?.id;
    record("Post comment", c.status < 400 && !!commentId, `HTTP ${c.status} id=${commentId || c.json?.error}`);

    if (commentId) {
      const edited = await req(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "Feature check comment (edited)", ...terms }),
        cookieJar: jar,
      });
      const editedOk =
        edited.status < 400 &&
        (edited.json?.ok === true ||
          edited.json?.comment?.body?.includes("edited") ||
          (edited.json?.comments ?? []).some(
            (row: { id?: string; body?: string }) =>
              row.id === commentId && String(row.body ?? "").includes("edited"),
          ));
      record(
        "Edit comment",
        editedOk,
        `HTTP ${edited.status} ${edited.json?.error ?? "ok"}`,
      );

      const deleted = await req(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: "" }),
        cookieJar: jar,
      });
      record(
        "Delete comment",
        deleted.status < 400 && deleted.json?.ok !== false,
        `HTTP ${deleted.status} ${deleted.json?.error ?? "ok"}`,
      );
    }

    const f = await req("/api/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...engageTarget,
        reason: "spam",
        website: "",
      }),
      cookieJar: jar,
    });
    record("Flag content", f.status < 400 && f.json?.ok !== false, `HTTP ${f.status} ${f.json?.error ?? "ok"}`);
  }

  // --- Profile / follow / prefs / discovery ---
  {
    const me = await req("/api/auth/me", { cookieJar: jar });
    const anon = me.json?.session?.anonId as string | undefined;
    record("Auth me", me.status === 200 && !!anon, anon || me.json?.error || "");
    if (anon) {
      const p = await req(`/api/profiles/${anon}`, { cookieJar: jar });
      record("Profile", p.status === 200 && p.json?.profile?.anonId === anon, `HTTP ${p.status}`);
    }
    // follow another known anon if any from dashboard/hot — create second identity is heavy; follow self should fail
    if (anon) {
      const bad = await req("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonId: anon, action: "follow", website: "" }),
        cookieJar: jar,
      });
      record(
        "Follow self rejected",
        bad.status >= 400 || bad.json?.ok === false || bad.json?.error,
        `HTTP ${bad.status} ${bad.json?.error ?? JSON.stringify(bad.json).slice(0, 60)}`,
      );
    }
  }

  {
    const r = await req("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { feedSort: "hot" }, themeId: "brand-day" }),
      cookieJar: jar,
    });
    record(
      "Preferences PATCH",
      r.status === 200 && r.json?.settings?.preferences?.feedSort === "hot",
      `HTTP ${r.status} sort=${r.json?.settings?.preferences?.feedSort}`,
    );
  }

  // --- Read surfaces ---
  for (const path of [
    "/api/feed",
    "/api/issues",
    "/api/demands",
    "/api/reports",
    "/api/proposals",
    "/api/shares",
    "/api/notices",
    "/api/memes",
    "/api/discussions",
    "/api/hashtags",
    "/api/explore",
    "/api/dashboard",
  ]) {
    const r = await req(path);
    record(`GET ${path}`, r.status === 200, `HTTP ${r.status}`);
  }

  // pages for created entities
  const portal = "/unreleased";
  const pageChecks: [string, string][] = [];
  if (demandId) pageChecks.push([`${portal}/petitions/${demandId}`, "petition page"]);
  if (reportId) pageChecks.push([`${portal}/reports/${reportId}`, "report page"]);
  if (proposalId) pageChecks.push([`${portal}/vote/${proposalId}`, "vote page"]);
  if (shareId) pageChecks.push([`${portal}/share/${shareId}`, "share page"]);
  if (noticeId) pageChecks.push([`${portal}/notice/${noticeId}`, "notice page"]);
  if (issueSlug) pageChecks.push([`${portal}/issues/${issueSlug}`, "issue page"]);
  if (memeId) pageChecks.push([`${portal}/memes/${memeId}`, "meme page"]);
  for (const [path, name] of pageChecks) {
    const r = await req(path);
    record(name, r.status >= 200 && r.status < 400, `HTTP ${r.status}`);
  }

  {
    const html = await fetch(BASE + "/").then((x) => x.text());
    record(
      "Launch date on home",
      html.includes("26 January 2027"),
      html.includes("January 2027") ? "found" : "missing",
    );
    record(
      "Brand tagline on home",
      html.includes("India's first open source social platform") ||
        html.includes("India&#x27;s first open source social platform") ||
        html.includes("India&apos;s first open source social platform"),
      html.includes("open source social") ? "found" : "missing",
    );
  }

  // unauthenticated write still gated
  {
    const r = await req("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x", body: "y", website: "" }),
    });
    record("Anon write gated", r.status === 401 || r.status === 403, `HTTP ${r.status}`);
  }

  finish(rows.some((r) => !r.ok) ? 1 : 0);
}

function finish(code: number) {
  const failed = rows.filter((r) => !r.ok);
  console.log(`\n${rows.length - failed.length}/${rows.length} passed, ${failed.length} failed`);
  process.exit(code);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
