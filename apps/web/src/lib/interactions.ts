import { prisma } from "@/lib/db";
import { rules } from "@/lib/config";
import { isValidVisitorId } from "@/lib/telemetry";
import { resolveSessionFromRequest } from "@/lib/session";

export type InteractionInput = {
  name: string;
  surface?: string;
  visitorId?: string | null;
  sessionId?: string | null;
  anonId?: string | null;
  path?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  props?: Record<string, unknown> | null;
  /** When set, resolve anonId from auth cookie and visitorId from header if missing */
  req?: Request;
};

function truncate(s: unknown, max: number): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max) : t;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

/** Strip secrets / PII from interaction props before persistence. */
export function sanitizeInteractionProps(
  props: Record<string, unknown> | null | undefined,
  maxChars: number,
): string | undefined {
  if (!props) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(props)) {
    if (/phone|otp|password|token|secret|clipboard|keystroke/i.test(key)) {
      continue;
    }
    if (typeof raw === "string") {
      const v = truncate(raw, 500);
      if (v !== undefined) out[key] = v;
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      out[key] = raw;
    } else if (typeof raw === "boolean") {
      out[key] = raw;
    } else if (raw === null) {
      out[key] = null;
    } else if (Array.isArray(raw)) {
      out[key] = raw.slice(0, 20).map((item) => {
        if (typeof item === "string") return item.slice(0, 120);
        if (typeof item === "number" || typeof item === "boolean") return item;
        return undefined;
      }).filter((x) => x !== undefined);
    } else if (raw && typeof raw === "object") {
      const nested: Record<string, unknown> = {};
      for (const [nk, nv] of Object.entries(raw as Record<string, unknown>)) {
        if (/phone|otp|password|token|secret/i.test(nk)) continue;
        if (typeof nv === "string") nested[nk] = nv.slice(0, 200);
        else if (typeof nv === "number" || typeof nv === "boolean") nested[nk] = nv;
      }
      out[key] = nested;
    }
  }
  delete out.phone;
  delete out.phoneHash;
  delete out.otp;
  delete out.code;
  delete out.clipboardText;
  delete out.keystrokes;
  delete out.password;

  const json = JSON.stringify(out);
  if (json === "{}") return undefined;
  if (json.length > maxChars) {
    return JSON.stringify({ truncated: true, size: json.length });
  }
  return json;
}

export function visitorIdFromRequest(req: Request): string | null {
  const h = req.headers.get("x-janark-visitor-id")?.trim();
  if (h && isValidVisitorId(h)) return h;
  return null;
}

export function isAllowedInteractionName(name: string): boolean {
  const cfg = rules.interactions();
  return cfg.names.includes(name);
}

/**
 * Persist one product interaction. Never throws to callers — failures are logged.
 * Phone numbers / OTP / raw IP are never written.
 */
export async function recordInteraction(
  input: InteractionInput,
): Promise<{ ok: boolean; id?: string }> {
  try {
    const cfg = rules.interactions();
    if (!cfg.enabled) return { ok: false };
    if (!isAllowedInteractionName(input.name)) return { ok: false };

    const surfaces = cfg.surfaces;
    const surfaceRaw = (input.surface || "web").toLowerCase();
    const surface = surfaces.includes(surfaceRaw) ? surfaceRaw : "web";

    let visitorId =
      input.visitorId && isValidVisitorId(input.visitorId)
        ? input.visitorId
        : null;
    let anonId = truncate(input.anonId, 64) ?? null;
    let sessionId = truncate(input.sessionId, 64) ?? null;

    if (input.req) {
      if (!visitorId) visitorId = visitorIdFromRequest(input.req);
      if (!anonId) {
        const auth = await resolveSessionFromRequest(input.req);
        if (auth?.phoneHash) {
          const identity = await prisma.phoneIdentity.findUnique({
            where: { phoneHash: auth.phoneHash },
            select: { anonId: true },
          });
          anonId = identity?.anonId ?? null;
          if (!visitorId && anonId) {
            const visit = await prisma.visitSession.findFirst({
              where: { anonId },
              orderBy: { lastSeenAt: "desc" },
              select: { visitorId: true, id: true },
            });
            visitorId = visit?.visitorId ?? null;
            if (!sessionId) sessionId = visit?.id ?? null;
          }
        }
      }
    }

    const path = truncate(input.path, cfg.maxPathChars) ?? null;
    const targetType = truncate(input.targetType, 64) ?? null;
    const targetId = truncate(input.targetId, 128) ?? null;
    const propsJson = sanitizeInteractionProps(
      input.props ?? undefined,
      cfg.maxPropsJsonChars,
    );

    const row = await prisma.interactionEvent.create({
      data: {
        name: input.name,
        surface,
        visitorId,
        sessionId,
        anonId,
        path,
        targetType,
        targetId,
        propsJson,
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  } catch (err) {
    console.error("[interactions]", err);
    return { ok: false };
  }
}

/** Fire-and-forget wrapper for route handlers. */
export function trackInteraction(input: InteractionInput): void {
  void recordInteraction(input);
}

export function shouldSampleSearch(): boolean {
  const rate = rules.interactions().searchSampleRate;
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() < rate;
}

export function truncateSearchQuery(q: string): string {
  const max = rules.interactions().maxQueryChars;
  return q.trim().slice(0, max);
}

export { asNumber, asBool };
