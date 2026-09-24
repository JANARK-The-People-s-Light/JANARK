"use client";

import { getVisitorId } from "@/components/VisitTelemetry";

type TrackProps = {
  path?: string;
  targetType?: string;
  targetId?: string;
  sessionId?: string;
  props?: Record<string, unknown>;
};

type Queued = {
  name: string;
  path?: string;
  targetType?: string;
  targetId?: string;
  sessionId?: string;
  props?: Record<string, unknown>;
};

const queue: Queued[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_MS = 800;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, FLUSH_MS);
}

async function flushQueue() {
  if (typeof window === "undefined") return;
  if (queue.length === 0) return;
  const visitorId = getVisitorId();
  if (!visitorId) {
    queue.length = 0;
    return;
  }
  const batch = queue.splice(0, 40);
  try {
    await fetch("/api/telemetry/interaction", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        doNotTrack: navigator.doNotTrack === "1",
        events: batch,
      }),
      keepalive: true,
    });
  } catch {
    /* non-blocking */
  }
}

/**
 * Queue a product interaction from the browser (search, ads, opens, …).
 * Flushes shortly after; safe to call from any client component.
 */
export function trackClientInteraction(name: string, opts: TrackProps = {}) {
  if (typeof window === "undefined") return;
  queue.push({
    name,
    path: opts.path ?? window.location.pathname,
    targetType: opts.targetType,
    targetId: opts.targetId,
    sessionId: opts.sessionId,
    props: opts.props,
  });
  scheduleFlush();
}

/** Immediate flush (e.g. before unload). */
export function flushClientInteractions() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  void flushQueue();
}
