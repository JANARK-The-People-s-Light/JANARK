/**
 * Mobile layout validation for Janark portal at common phone viewports.
 * Run: npx playwright install chromium && BASE_URL=http://localhost:3000 npx tsx scripts/validate-mobile.ts
 */
import { chromium, type Page } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PORTAL = "/unreleased";

const VIEWPORTS = [
  { name: "iPhone-SE", width: 375, height: 667 },
  { name: "iPhone-12", width: 390, height: 844 },
];

/** Portal routes (under /unreleased while marketing `/` is coming-soon). */
const PORTAL_ROUTES = [
  PORTAL,
  `${PORTAL}/feed`,
  `${PORTAL}/issues`,
  `${PORTAL}/petitions`,
  `${PORTAL}/reports`,
  `${PORTAL}/vote`,
  `${PORTAL}/dashboard`,
  `${PORTAL}/login`,
  `${PORTAL}/settings`,
  `${PORTAL}/about`,
  `${PORTAL}/feed/new`,
  `${PORTAL}/petitions/new`,
  `${PORTAL}/reports/new`,
];

type Issue = {
  route: string;
  viewport: string;
  kind: string;
  detail: string;
};

async function checkMarketingHome(page: Page, vpName: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  const res = await page.goto(`${BASE}/`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  if (!res || res.status() >= 500) {
    issues.push({
      route: "/",
      viewport: vpName,
      kind: "http",
      detail: `status ${res?.status() ?? "none"}`,
    });
    return issues;
  }
  await page.waitForTimeout(300);
  const ok = await page.evaluate(() => {
    const body = document.body?.innerText || "";
    return body.length > 20;
  });
  if (!ok) {
    issues.push({
      route: "/",
      viewport: vpName,
      kind: "empty",
      detail: "marketing home has no content",
    });
  }
  return issues;
}

async function checkPortalPage(
  page: Page,
  route: string,
  vpName: string,
): Promise<Issue[]> {
  const issues: Issue[] = [];
  const url = `${BASE}${route}`;
  const res = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  if (!res || res.status() >= 500) {
    issues.push({
      route,
      viewport: vpName,
      kind: "http",
      detail: `status ${res?.status() ?? "none"}`,
    });
    return issues;
  }

  await page.waitForTimeout(450);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientWidth = doc.clientWidth;
    const overflowX = scrollWidth - clientWidth;

    const header = document.querySelector("header");
    const menuBtn = document.querySelector(
      'header button[aria-label="Open menu"]',
    );
    const mobilePrimary = document.querySelector(
      'nav[aria-label="Mobile primary"]',
    );

    const offenders: string[] = [];
    const all = Array.from(document.querySelectorAll("body *"));
    for (const el of all.slice(0, 800)) {
      const r = (el as HTMLElement).getBoundingClientRect?.();
      if (!r || r.width === 0) continue;
      if (r.right > clientWidth + 2 || r.left < -2) {
        const tag = (el as HTMLElement).tagName.toLowerCase();
        const cls = ((el as HTMLElement).className || "")
          .toString()
          .slice(0, 60);
        offenders.push(
          `${tag}.${cls} L=${Math.round(r.left)} R=${Math.round(r.right)}`,
        );
        if (offenders.length >= 8) break;
      }
    }

    return {
      overflowX,
      clientWidth,
      scrollWidth,
      hasHeader: !!header,
      hasMenuBtn: !!menuBtn,
      hasMobilePrimary: !!mobilePrimary,
      offenders,
    };
  });

  if (metrics.overflowX > 8) {
    issues.push({
      route,
      viewport: vpName,
      kind: "horizontal-overflow",
      detail: `scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} (Δ ${metrics.overflowX})`,
    });
  }

  if (!metrics.hasHeader) {
    issues.push({
      route,
      viewport: vpName,
      kind: "missing-header",
      detail: "no header",
    });
  }

  if (!metrics.hasMenuBtn) {
    issues.push({
      route,
      viewport: vpName,
      kind: "missing-mobile-menu",
      detail: "hamburger button not found",
    });
  }

  if (!metrics.hasMobilePrimary && !route.includes("/new")) {
    issues.push({
      route,
      viewport: vpName,
      kind: "missing-bottom-nav",
      detail: "Mobile primary nav not found",
    });
  }

  if (metrics.offenders.length > 0 && metrics.overflowX > 8) {
    issues.push({
      route,
      viewport: vpName,
      kind: "overflow-elements",
      detail: metrics.offenders.join(" | "),
    });
  }

  if (metrics.hasMenuBtn) {
    await page.click('header button[aria-label="Open menu"]');
    await page.waitForTimeout(250);
    const menuOk = await page.evaluate(() => {
      const drawer = document.querySelector('[aria-label="Navigation"]');
      if (!drawer) return { ok: false, reason: "no navigation drawer" };
      const links = drawer.querySelectorAll("a");
      return {
        ok: links.length >= 6,
        reason: links.length < 6 ? `only ${links.length} links` : "ok",
      };
    });
    if (!menuOk.ok) {
      issues.push({
        route,
        viewport: vpName,
        kind: "mobile-menu-broken",
        detail: menuOk.reason,
      });
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }

  return issues;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const all: Issue[] = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      ignoreHTTPSErrors: BASE.startsWith("https:"),
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    });
    const page = await context.newPage();

    try {
      const homeIssues = await checkMarketingHome(page, vp.name);
      all.push(...homeIssues);
      process.stdout.write(
        homeIssues.length === 0
          ? `✓ ${vp.name} /\n`
          : `✗ ${vp.name} / (${homeIssues.length} issues)\n`,
      );
    } catch (e) {
      all.push({
        route: "/",
        viewport: vp.name,
        kind: "crash",
        detail: String(e),
      });
      process.stdout.write(`✗ ${vp.name} / CRASH\n`);
    }

    for (const route of PORTAL_ROUTES) {
      try {
        const found = await checkPortalPage(page, route, vp.name);
        all.push(...found);
        process.stdout.write(
          found.length === 0
            ? `✓ ${vp.name} ${route}\n`
            : `✗ ${vp.name} ${route} (${found.length} issues)\n`,
        );
      } catch (e) {
        all.push({
          route,
          viewport: vp.name,
          kind: "crash",
          detail: String(e),
        });
        process.stdout.write(`✗ ${vp.name} ${route} CRASH\n`);
      }
    }
    await context.close();
  }

  await browser.close();

  console.log("\n=== SUMMARY ===");
  if (all.length === 0) {
    console.log("All mobile checks passed.");
    return;
  }
  for (const i of all) {
    console.log(`[${i.viewport}] ${i.route} · ${i.kind}: ${i.detail}`);
  }
  console.log(`\n${all.length} issue(s) found.`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
