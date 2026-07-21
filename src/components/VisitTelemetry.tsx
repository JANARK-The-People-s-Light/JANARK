"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "janark_vid";
const PREV_VISIT_KEY = "janark_prev_visit";
const SESSION_KEY = "janark_vsession";

type QueuedEvent = {
  kind: string;
  path?: string;
  data?: Record<string, unknown>;
};

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  }
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id || id.length < 8) {
      id = randomId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

function getStoredSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function setStoredSessionId(id: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    /* ignore */
  }
}

function hashString(input: string): string {
  // FNV-1a 32-bit → hex (client-side fingerprint digest, not crypto auth)
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function parseUa(ua: string) {
  let browserName = "Unknown";
  let browserVersion = "";
  let operatingSystem = "Unknown";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

  if (/iPad|Tablet/i.test(ua)) deviceType = "tablet";
  else if (/Mobi|Android/i.test(ua)) deviceType = "mobile";

  if (/Windows NT/i.test(ua)) operatingSystem = "Windows";
  else if (/Mac OS X/i.test(ua)) operatingSystem = "macOS";
  else if (/Android/i.test(ua)) operatingSystem = "Android";
  else if (/iPhone|iPad/i.test(ua)) operatingSystem = "iOS";
  else if (/Linux/i.test(ua)) operatingSystem = "Linux";

  const browsers: [RegExp, string][] = [
    [/Edg\/([\d.]+)/, "Edge"],
    [/Chrome\/([\d.]+)/, "Chrome"],
    [/Firefox\/([\d.]+)/, "Firefox"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
  ];
  for (const [re, name] of browsers) {
    const m = ua.match(re);
    if (m) {
      browserName = name;
      browserVersion = m[1] ?? "";
      break;
    }
  }
  return { browserName, browserVersion, operatingSystem, deviceType };
}

function detectAdBlocker(): boolean {
  try {
    const el = document.createElement("div");
    el.className = "adsbox ad-banner adsbygoogle";
    el.style.cssText =
      "position:absolute;left:-9999px;width:1px;height:1px;pointer-events:none";
    document.body.appendChild(el);
    const blocked = el.offsetParent === null && el.offsetHeight === 0;
    el.remove();
    return blocked;
  } catch {
    return false;
  }
}

function canvasFingerprint(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 50;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = "#069";
    ctx.fillText("janark-fp", 2, 15);
    return hashString(c.toDataURL());
  } catch {
    return "";
  }
}

function webglInfo(): {
  gpuRenderer?: string;
  webglCapabilities?: Record<string, string | undefined>;
} {
  try {
    const c = document.createElement("canvas");
    const gl =
      c.getContext("webgl") ||
      (c.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return {};
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = ext
      ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? "")
      : "";
    const renderer = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "")
      : "";
    return {
      gpuRenderer: renderer.slice(0, 200),
      webglCapabilities: {
        vendor: vendor.slice(0, 80),
        renderer: renderer.slice(0, 120),
        version: String(gl.getParameter(gl.VERSION) ?? "").slice(0, 40),
      },
    };
  } catch {
    return {};
  }
}

async function audioFingerprint(): Promise<string> {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return "";
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const comp = ctx.createDynamicsCompressor();
    osc.type = "triangle";
    osc.frequency.value = 10000;
    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);
    await new Promise((r) => setTimeout(r, 30));
    const sig = [
      ctx.sampleRate,
      ctx.destination.maxChannelCount,
      comp.threshold.value,
      comp.knee.value,
      comp.ratio.value,
      comp.attack.value,
      comp.release.value,
    ].join("|");
    osc.stop();
    await ctx.close();
    return hashString(sig);
  } catch {
    return "";
  }
}

function utmFromSearch(sp: URLSearchParams) {
  const utm: Record<string, string> = {};
  for (const k of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ]) {
    const v = sp.get(k);
    if (v) utm[k] = v.slice(0, 120);
  }
  return utm;
}

function trafficSource(referrer: string, utm: Record<string, string>) {
  if (utm.utm_source) return `utm:${utm.utm_source}`;
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname;
    if (host.includes(window.location.hostname)) return "internal";
    return `referral:${host}`;
  } catch {
    return "referral";
  }
}

function storageOk(kind: "local" | "session"): boolean {
  try {
    const s = kind === "local" ? localStorage : sessionStorage;
    const k = "__jn_t";
    s.setItem(k, "1");
    s.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

type CollectorState = {
  pageViews: number;
  clickEvents: number;
  keyboardEvents: number;
  clipboardPasteEvents: number;
  mouseMoveSamples: number;
  scrollDepthPct: number;
  scrollPositionY: number;
  pagesVisited: string[];
  mouseMovement: { x: number; y: number; t: number }[];
  errorLogs: { message?: string; source?: string; line?: number; col?: number }[];
  entryPage: string;
  sessionStartedAt: number;
  pageStartedAt: number;
};

function createState(path: string): CollectorState {
  return {
    pageViews: 0,
    clickEvents: 0,
    keyboardEvents: 0,
    clipboardPasteEvents: 0,
    mouseMoveSamples: 0,
    scrollDepthPct: 0,
    scrollPositionY: 0,
    pagesVisited: [path],
    mouseMovement: [],
    errorLogs: [],
    entryPage: path,
    sessionStartedAt: Date.now(),
    pageStartedAt: Date.now(),
  };
}

async function buildClientSnapshot(
  state: CollectorState,
  pathname: string,
  searchParams: URLSearchParams,
) {
  const ua = navigator.userAgent || "";
  const parsed = parseUa(ua);
  const utm = utmFromSearch(searchParams);
  const referrer = document.referrer || "";
  let previousVisitAt: string | undefined;
  let visitorKind: "new" | "returning" = "new";
  try {
    previousVisitAt = localStorage.getItem(PREV_VISIT_KEY) || undefined;
    if (previousVisitAt) visitorKind = "returning";
  } catch {
    /* ignore */
  }

  const nav = performance.getEntriesByType?.(
    "navigation",
  )?.[0] as PerformanceNavigationTiming | undefined;
  const navigationTiming = nav
    ? {
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        connect: nav.connectEnd - nav.connectStart,
        ttfb: nav.responseStart - nav.requestStart,
        domContentLoaded:
          nav.domContentLoadedEventEnd - nav.startTime,
        load: nav.loadEventEnd - nav.startTime,
      }
    : undefined;

  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number };
    }
  ).connection;

  const webgl = webglInfo();
  const audio = await audioFingerprint();

  const cookieNames = document.cookie
    ? document.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean)
        .slice(0, 30)
    : [];

  const features = {
    serviceWorker: "serviceWorker" in navigator,
    webgl: Boolean(
      document.createElement("canvas").getContext("webgl") ||
        document.createElement("canvas").getContext("experimental-webgl"),
    ),
    webRTC: !!(
      (window as unknown as { RTCPeerConnection?: unknown }).RTCPeerConnection
    ),
    webAssembly: typeof WebAssembly !== "undefined",
    notification: "Notification" in window,
    geolocation: "geolocation" in navigator,
  };

  let installedPwa = false;
  try {
    installedPwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    /* ignore */
  }

  const perfMetrics: Record<string, number> = {};
  try {
    const paints = performance.getEntriesByType("paint");
    for (const p of paints) {
      if (p.name === "first-contentful-paint") perfMetrics.fcp = p.startTime;
    }
  } catch {
    /* ignore */
  }

  return {
    browserName: parsed.browserName,
    browserVersion: parsed.browserVersion,
    operatingSystem: parsed.operatingSystem,
    deviceType: parsed.deviceType,
    userAgent: ua.slice(0, 512),
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    windowSize: `${window.outerWidth}x${window.outerHeight}`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferredLanguage: navigator.language,
    acceptedLanguages: (navigator.languages || []).join(",").slice(0, 120),
    referrerUrl: referrer.slice(0, 512),
    currentUrl: window.location.href.slice(0, 512),
    entryPage: state.entryPage,
    exitPage: pathname,
    pagesVisited: state.pagesVisited.slice(-50),
    pageViews: state.pageViews,
    clickEvents: state.clickEvents,
    keyboardEvents: state.keyboardEvents,
    clipboardPasteEvents: state.clipboardPasteEvents,
    mouseMoveSamples: state.mouseMoveSamples,
    mouseMovement: state.mouseMovement.slice(-40),
    scrollDepthPct: state.scrollDepthPct,
    scrollPositionY: state.scrollPositionY,
    timeOnPageMs: Date.now() - state.pageStartedAt,
    sessionDurationMs: Date.now() - state.sessionStartedAt,
    networkConnectionType: conn?.effectiveType,
    estimatedNetworkSpeed:
      typeof conn?.downlink === "number" ? `${conn.downlink}Mbps` : undefined,
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory,
    ...webgl,
    canvasFingerprint: canvasFingerprint(),
    audioFingerprint: audio,
    supportedBrowserFeatures: features,
    colorSchemePreference: window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light",
    pixelRatio: window.devicePixelRatio,
    orientation:
      window.innerWidth >= window.innerHeight ? "landscape" : "portrait",
    maxTouchPoints: navigator.maxTouchPoints,
    localStorageAvailable: storageOk("local"),
    sessionStorageAvailable: storageOk("session"),
    indexedDbAvailable: typeof indexedDB !== "undefined",
    cacheSupport: "caches" in window,
    doNotTrack: navigator.doNotTrack || undefined,
    pageVisibilityState: document.visibilityState,
    navigationTiming,
    performanceMetrics: perfMetrics,
    javascriptEnabled: true,
    adBlockerDetected: detectAdBlocker(),
    installedPwa,
    previousVisitAt,
    visitorKind,
    utm,
    trafficSource: trafficSource(referrer, utm),
    cookieNames,
    cookiesEnabled: navigator.cookieEnabled,
    errorLogs: state.errorLogs.slice(-10),
  };
}

async function flush(
  state: CollectorState,
  pathname: string,
  searchParams: URLSearchParams,
  events: QueuedEvent[],
  ended?: boolean,
) {
  const visitorId = getVisitorId();
  if (!visitorId) return;

  const client = await buildClientSnapshot(state, pathname, searchParams);
  if (ended) client.exitPage = pathname;

  try {
    const res = await fetch("/api/telemetry/visit", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        sessionId: getStoredSessionId(),
        client,
        events,
      }),
      keepalive: Boolean(ended),
    });
    if (res.ok) {
      const data = (await res.json()) as { sessionId?: string };
      if (data.sessionId) setStoredSessionId(data.sessionId);
      try {
        localStorage.setItem(PREV_VISIT_KEY, new Date().toISOString());
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* non-blocking */
  }
}

/**
 * Collects visit telemetry for every page. Public identity remains anonId only;
 * phone linkage happens server-side after OTP via opaque visitorId.
 */
export function VisitTelemetry() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const stateRef = useRef<CollectorState | null>(null);
  const queueRef = useRef<QueuedEvent[]>([]);
  const lastMouseSample = useRef(0);

  useEffect(() => {
    if (!stateRef.current) {
      stateRef.current = createState(pathname);
    }
    const state = stateRef.current;
    state.pageViews += 1;
    state.pageStartedAt = Date.now();
    if (!state.pagesVisited.includes(pathname)) {
      state.pagesVisited.push(pathname);
    }
    queueRef.current.push({
      kind: "pageview",
      path: pathname,
      data: { path: pathname },
    });

    const onClick = (e: MouseEvent) => {
      state.clickEvents += 1;
      const t = e.target as HTMLElement | null;
      queueRef.current.push({
        kind: "click",
        path: pathname,
        data: {
          x: e.clientX,
          y: e.clientY,
          tag: t?.tagName?.toLowerCase(),
          id: t?.id || undefined,
          href: (t as HTMLAnchorElement | null)?.href?.slice(0, 200),
        },
      });
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      const depth = max > 0 ? Math.round((y / max) * 100) : 0;
      state.scrollPositionY = Math.round(y);
      state.scrollDepthPct = Math.max(state.scrollDepthPct, depth);
      queueRef.current.push({
        kind: "scroll",
        path: pathname,
        data: { y: Math.round(y), depthPct: depth },
      });
    };

    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const onScrollDebounced = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(onScroll, 400);
    };

    const onKey = () => {
      state.keyboardEvents += 1;
      queueRef.current.push({
        kind: "keyboard",
        path: pathname,
        data: { count: 1 },
      });
    };

    const onPaste = () => {
      state.clipboardPasteEvents += 1;
      queueRef.current.push({
        kind: "paste",
        path: pathname,
        data: { count: 1 },
      });
    };

    const onMouse = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseSample.current < 800) return;
      lastMouseSample.current = now;
      state.mouseMoveSamples += 1;
      const sample = {
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        t: now - state.sessionStartedAt,
      };
      state.mouseMovement.push(sample);
      if (state.mouseMovement.length > 40) state.mouseMovement.shift();
      queueRef.current.push({
        kind: "mouse_sample",
        path: pathname,
        data: sample,
      });
    };

    const onError = (ev: ErrorEvent) => {
      state.errorLogs.push({
        message: String(ev.message || "").slice(0, 200),
        source: String(ev.filename || "").slice(0, 120),
        line: ev.lineno,
        col: ev.colno,
      });
      queueRef.current.push({
        kind: "error",
        path: pathname,
        data: {
          message: String(ev.message || "").slice(0, 200),
          source: String(ev.filename || "").slice(0, 120),
          line: ev.lineno,
        },
      });
    };

    const onVisibility = () => {
      queueRef.current.push({
        kind: "heartbeat",
        path: pathname,
        data: {
          path: pathname,
          visibility: document.visibilityState,
          timeOnPageMs: Date.now() - state.pageStartedAt,
          scrollDepthPct: state.scrollDepthPct,
        },
      });
    };

    const drain = () => {
      const batch = queueRef.current.splice(0, 40);
      void flush(state, pathname, searchParams, batch);
    };

    // Initial + periodic flush
    const t0 = setTimeout(drain, 1500);
    const interval = setInterval(drain, 20_000);

    const onUnload = () => {
      const batch = queueRef.current.splice(0, 40);
      batch.push({
        kind: "unload",
        path: pathname,
        data: {
          path: pathname,
          timeOnPageMs: Date.now() - state.pageStartedAt,
          scrollDepthPct: state.scrollDepthPct,
        },
      });
      void flush(state, pathname, searchParams, batch, true);
    };

    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("scroll", onScrollDebounced, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    window.addEventListener("paste", onPaste, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onUnload);

    return () => {
      clearTimeout(t0);
      clearInterval(interval);
      if (scrollTimer) clearTimeout(scrollTimer);
      drain();
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScrollDebounced);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [pathname, searchParams]);

  return null;
}
