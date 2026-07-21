import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const IP_SALT =
  process.env.IP_HASH_SALT ||
  process.env.PHONE_HASH_SALT ||
  "janark-dev-ip-salt";

const VISITOR_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const MAX_JSON = 48_000;
const MAX_UA = 512;
const MAX_PATH = 512;
const MAX_EVENTS_PER_BATCH = 40;

export function isValidVisitorId(id: unknown): id is string {
  return typeof id === "string" && VISITOR_ID_RE.test(id);
}

/** One-way IP hash — never store raw client IP */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${IP_SALT}:${ip}`).digest("hex");
}

export function clientIpFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  return cf || fwd || real || "local";
}

/** Coarse geo / ISP from common edge headers only (no third-party lookup). */
export function approxLocationFromRequest(req: Request): {
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
} {
  const h = (name: string) => req.headers.get(name)?.trim() || undefined;
  return {
    country:
      h("cf-ipcountry") ||
      h("x-vercel-ip-country") ||
      h("cloudfront-viewer-country"),
    region:
      h("x-vercel-ip-country-region") ||
      h("cloudfront-viewer-country-region"),
    city: h("x-vercel-ip-city") || h("cloudfront-viewer-city"),
    isp: h("x-isp") || h("x-as-org") || undefined,
  };
}

export function requestMetaFromRequest(req: Request) {
  const accept = req.headers.get("accept")?.slice(0, 200) || undefined;
  const acceptEncoding =
    req.headers.get("accept-encoding")?.slice(0, 120) || undefined;
  const acceptLanguage =
    req.headers.get("accept-language")?.slice(0, 120) || undefined;
  const ua = req.headers.get("user-agent")?.slice(0, MAX_UA) || undefined;
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.url.startsWith("https") ? "https" : "http");
  return {
    httpHeaders: { accept, acceptEncoding, acceptLanguage },
    tlsHttps: {
      forwardedProto: proto,
      isHttps: proto === "https",
    },
    userAgent: ua,
    serverTimestamp: new Date().toISOString(),
  };
}

function truncate(s: unknown, max: number): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max) : t;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/** Strip secrets / PII from client snapshot before persistence. */
export function sanitizeClientSnapshot(
  raw: unknown,
): Record<string, unknown> {
  const c = asObject(raw) || {};
  const out: Record<string, unknown> = {};

  const copyStr = (key: string, max: number) => {
    const v = truncate(c[key], max);
    if (v !== undefined) out[key] = v;
  };
  const copyNum = (key: string) => {
    const v = asNumber(c[key]);
    if (v !== undefined) out[key] = v;
  };
  const copyBool = (key: string) => {
    const v = asBool(c[key]);
    if (v !== undefined) out[key] = v;
  };

  copyStr("browserName", 64);
  copyStr("browserVersion", 64);
  copyStr("operatingSystem", 64);
  copyStr("deviceType", 32);
  copyStr("userAgent", MAX_UA);
  copyStr("screenResolution", 32);
  copyStr("viewportSize", 32);
  copyStr("windowSize", 32);
  copyStr("timeZone", 64);
  copyStr("preferredLanguage", 32);
  copyStr("acceptedLanguages", 120);
  copyStr("referrerUrl", MAX_PATH);
  copyStr("currentUrl", MAX_PATH);
  copyStr("entryPage", MAX_PATH);
  copyStr("exitPage", MAX_PATH);
  copyStr("trafficSource", 64);
  copyStr("networkConnectionType", 32);
  copyStr("estimatedNetworkSpeed", 32);
  copyStr("colorSchemePreference", 16);
  copyStr("orientation", 16);
  copyStr("pageVisibilityState", 16);
  copyStr("doNotTrack", 16);
  copyStr("gpuRenderer", 200);
  copyStr("canvasFingerprint", 64); // expect pre-hashed client-side
  copyStr("audioFingerprint", 64);
  copyStr("previousVisitAt", 40);
  copyStr("visitorKind", 16); // new | returning
  copyStr("ipHash", 64);
  copyStr("serverTimestamp", 40);

  const approx = asObject(c.approximateLocation);
  if (approx) {
    out.approximateLocation = {
      country: truncate(approx.country, 8),
      region: truncate(approx.region, 64),
      city: truncate(approx.city, 64),
      isp: truncate(approx.isp, 120),
    };
  }

  const headers = asObject(c.httpHeaders);
  if (headers) {
    out.httpHeaders = {
      accept: truncate(headers.accept, 200),
      acceptEncoding: truncate(headers.acceptEncoding, 120),
      acceptLanguage: truncate(headers.acceptLanguage, 120),
    };
  }

  const tls = asObject(c.tlsHttps);
  if (tls) {
    out.tlsHttps = {
      forwardedProto: truncate(tls.forwardedProto, 16),
      isHttps: asBool(tls.isHttps),
    };
  }

  copyNum("pixelRatio");
  copyNum("maxTouchPoints");
  copyNum("hardwareConcurrency");
  copyNum("deviceMemory");
  copyNum("sessionDurationMs");
  copyNum("timeOnPageMs");
  copyNum("scrollDepthPct");
  copyNum("scrollPositionY");
  copyNum("pageViews");
  copyNum("clickEvents");
  copyNum("keyboardEvents");
  copyNum("clipboardPasteEvents");
  copyNum("mouseMoveSamples");

  copyBool("touchSupport");
  copyBool("localStorageAvailable");
  copyBool("sessionStorageAvailable");
  copyBool("indexedDbAvailable");
  copyBool("cacheSupport");
  copyBool("javascriptEnabled");
  copyBool("adBlockerDetected");
  copyBool("installedPwa");
  copyBool("cookiesEnabled");

  const utm = asObject(c.utm);
  if (utm) {
    const clean: Record<string, string> = {};
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ]) {
      const v = truncate(utm[k], 120);
      if (v) clean[k] = v;
    }
    if (Object.keys(clean).length) out.utm = clean;
  }

  const features = asObject(c.supportedBrowserFeatures);
  if (features) {
    const clean: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(features).slice(0, 40)) {
      if (typeof v === "boolean" && k.length < 40) clean[k] = v;
    }
    out.supportedBrowserFeatures = clean;
  }

  const webgl = asObject(c.webglCapabilities);
  if (webgl) {
    out.webglCapabilities = {
      vendor: truncate(webgl.vendor, 80),
      renderer: truncate(webgl.renderer, 120),
      version: truncate(webgl.version, 40),
    };
  }

  const nav = asObject(c.navigationTiming);
  if (nav) {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(nav).slice(0, 24)) {
      if (typeof v === "number" && Number.isFinite(v) && k.length < 40) {
        clean[k] = Math.round(v);
      }
    }
    out.navigationTiming = clean;
  }

  const perf = asObject(c.performanceMetrics);
  if (perf) {
    const clean: Record<string, number> = {};
    for (const k of ["lcp", "fcp", "cls", "inp", "ttfb"]) {
      const v = asNumber(perf[k]);
      if (v !== undefined) clean[k] = v;
    }
    out.performanceMetrics = clean;
  }

  // Cookie *names* only — never values (especially not janark_sid)
  if (Array.isArray(c.cookieNames)) {
    out.cookieNames = c.cookieNames
      .filter((n): n is string => typeof n === "string" && n.length < 40)
      .filter((n) => !/sid|token|auth|session/i.test(n))
      .slice(0, 30);
  }

  // Mouse samples: capped coarse points only
  if (Array.isArray(c.mouseMovement)) {
    out.mouseMovement = c.mouseMovement
      .slice(0, 40)
      .map((p) => {
        const o = asObject(p);
        if (!o) return null;
        const x = asNumber(o.x);
        const y = asNumber(o.y);
        const t = asNumber(o.t);
        if (x === undefined || y === undefined) return null;
        return { x: Math.round(x), y: Math.round(y), t: t ?? 0 };
      })
      .filter(Boolean);
  }

  if (Array.isArray(c.pagesVisited)) {
    out.pagesVisited = c.pagesVisited
      .filter((p): p is string => typeof p === "string")
      .map((p) => p.slice(0, MAX_PATH))
      .slice(0, 50);
  }

  if (Array.isArray(c.errorLogs)) {
    out.errorLogs = c.errorLogs
      .slice(0, 10)
      .map((e) => {
        const o = asObject(e);
        if (!o) return null;
        return {
          message: truncate(o.message, 200),
          source: truncate(o.source, 120),
          line: asNumber(o.line),
          col: asNumber(o.col),
        };
      })
      .filter(Boolean);
  }

  // Explicitly never persist these if client sends them
  delete out.phone;
  delete out.phoneHash;
  delete out.otp;
  delete out.code;
  delete out.clipboardText;
  delete out.keystrokes;
  delete out.password;

  const json = JSON.stringify(out);
  if (json.length > MAX_JSON) {
    return { truncated: true, size: json.length };
  }
  return out;
}

export function sanitizeEventData(
  kind: string,
  data: unknown,
): Record<string, unknown> | undefined {
  const o = asObject(data);
  if (!o) return undefined;
  const out: Record<string, unknown> = {};

  if (kind === "click") {
    out.x = asNumber(o.x);
    out.y = asNumber(o.y);
    out.tag = truncate(o.tag, 32);
    out.id = truncate(o.id, 64);
    out.href = truncate(o.href, MAX_PATH);
  } else if (kind === "scroll") {
    out.y = asNumber(o.y);
    out.depthPct = asNumber(o.depthPct);
  } else if (kind === "error") {
    out.message = truncate(o.message, 200);
    out.source = truncate(o.source, 120);
    out.line = asNumber(o.line);
  } else if (kind === "pageview" || kind === "heartbeat" || kind === "unload") {
    out.path = truncate(o.path, MAX_PATH);
    out.timeOnPageMs = asNumber(o.timeOnPageMs);
    out.scrollDepthPct = asNumber(o.scrollDepthPct);
    out.visibility = truncate(o.visibility, 16);
  } else if (kind === "paste" || kind === "keyboard") {
    // counts only — never content
    out.count = asNumber(o.count) ?? 1;
  } else if (kind === "mouse_sample") {
    out.x = asNumber(o.x);
    out.y = asNumber(o.y);
    out.t = asNumber(o.t);
  } else {
    out.note = "unsupported_kind_trimmed";
  }

  return out;
}

export async function linkVisitorToPhone(opts: {
  visitorId: string;
  phoneHash: string;
  anonId?: string | null;
}) {
  if (!isValidVisitorId(opts.visitorId)) return;

  await prisma.visitorPhoneLink.upsert({
    where: {
      visitorId_phoneHash: {
        visitorId: opts.visitorId,
        phoneHash: opts.phoneHash,
      },
    },
    create: {
      visitorId: opts.visitorId,
      phoneHash: opts.phoneHash,
      anonId: opts.anonId ?? undefined,
    },
    update: {
      anonId: opts.anonId ?? undefined,
      linkedAt: new Date(),
    },
  });

  await prisma.visitSession.updateMany({
    where: { visitorId: opts.visitorId },
    data: {
      phoneHash: opts.phoneHash,
      anonId: opts.anonId ?? undefined,
    },
  });
}

export async function upsertVisitSession(opts: {
  req: Request;
  visitorId: string;
  sessionId?: string | null;
  client: Record<string, unknown>;
  events?: Array<{ kind: string; path?: string; data?: unknown }>;
  phoneHash?: string | null;
  anonId?: string | null;
}) {
  const { req, visitorId } = opts;
  const ip = clientIpFromRequest(req);
  const ipHash = hashIp(ip);
  const geo = approxLocationFromRequest(req);
  const meta = requestMetaFromRequest(req);
  const snapshot = sanitizeClientSnapshot({
    ...opts.client,
    ...meta,
    approximateLocation: geo,
    ipHash, // store hash in snapshot too for completeness; raw IP never included
  });

  const entryPage =
    truncate(opts.client.entryPage, MAX_PATH) ||
    truncate(opts.client.currentUrl, MAX_PATH);
  const exitPage =
    truncate(opts.client.exitPage, MAX_PATH) ||
    truncate(opts.client.currentUrl, MAX_PATH);
  const referrer = truncate(opts.client.referrerUrl, MAX_PATH);
  const utm = snapshot.utm ? JSON.stringify(snapshot.utm) : undefined;
  const isReturning =
    opts.client.visitorKind === "returning" ||
    Boolean(opts.client.previousVisitAt);
  const pageViews = asNumber(opts.client.pageViews) ?? 1;

  let session =
    opts.sessionId
      ? await prisma.visitSession.findFirst({
          where: { id: opts.sessionId, visitorId },
        })
      : null;

  if (!session) {
    // Resume open session for this visitor within 30 minutes
    const since = new Date(Date.now() - 30 * 60 * 1000);
    session = await prisma.visitSession.findFirst({
      where: {
        visitorId,
        endedAt: null,
        lastSeenAt: { gte: since },
      },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  const phoneHash = opts.phoneHash ?? session?.phoneHash ?? null;
  const anonId = opts.anonId ?? session?.anonId ?? null;

  if (!session) {
    session = await prisma.visitSession.create({
      data: {
        visitorId,
        ipHash,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        isp: geo.isp,
        userAgent: meta.userAgent,
        deviceType: truncate(opts.client.deviceType, 32),
        browserName: truncate(opts.client.browserName, 64),
        browserVersion: truncate(opts.client.browserVersion, 64),
        osName: truncate(opts.client.operatingSystem, 64),
        entryPage,
        exitPage,
        referrer,
        utmJson: utm,
        trafficSource: truncate(opts.client.trafficSource, 64),
        isReturning,
        pageViews,
        snapshotJson: JSON.stringify(snapshot),
        phoneHash: phoneHash ?? undefined,
        anonId: anonId ?? undefined,
      },
    });
  } else {
    session = await prisma.visitSession.update({
      where: { id: session.id },
      data: {
        ipHash,
        country: geo.country ?? undefined,
        region: geo.region ?? undefined,
        city: geo.city ?? undefined,
        isp: geo.isp ?? undefined,
        userAgent: meta.userAgent,
        deviceType: truncate(opts.client.deviceType, 32),
        browserName: truncate(opts.client.browserName, 64),
        browserVersion: truncate(opts.client.browserVersion, 64),
        osName: truncate(opts.client.operatingSystem, 64),
        exitPage,
        referrer: referrer ?? undefined,
        utmJson: utm ?? undefined,
        trafficSource: truncate(opts.client.trafficSource, 64),
        isReturning: isReturning || session.isReturning,
        pageViews: Math.max(session.pageViews, pageViews),
        snapshotJson: JSON.stringify(snapshot),
        phoneHash: phoneHash ?? undefined,
        anonId: anonId ?? undefined,
        lastSeenAt: new Date(),
      },
    });
  }

  const events = (opts.events ?? []).slice(0, MAX_EVENTS_PER_BATCH);
  if (events.length) {
    await prisma.visitEvent.createMany({
      data: events.map((e) => ({
        sessionId: session!.id,
        visitorId,
        kind: truncate(e.kind, 32) || "unknown",
        path: truncate(e.path, MAX_PATH),
        dataJson: JSON.stringify(
          sanitizeEventData(String(e.kind || ""), e.data) ?? {},
        ),
      })),
    });
  }

  return { sessionId: session.id, visitorId };
}
