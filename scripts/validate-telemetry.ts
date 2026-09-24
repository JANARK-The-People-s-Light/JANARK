/**
 * Smoke-validate visit telemetry: sanitize privacy + DB roundtrip + OTP link.
 * Run: npx tsx scripts/validate-telemetry.ts
 */
import { createHash } from "node:crypto";
import { prisma } from "../apps/web/src/lib/db";
import {
  hashIp,
  isValidVisitorId,
  linkVisitorToPhone,
  sanitizeClientSnapshot,
  sanitizeEventData,
  upsertVisitSession,
} from "../apps/web/src/lib/telemetry";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

async function main() {
  // --- sanitize privacy ---
  const dirty = {
    browserName: "Chrome",
    phone: "+919876543210",
    phoneHash: "abc123",
    otp: "123456",
    clipboardText: "secret paste",
    keystrokes: "password123",
    cookieNames: ["janark_sid", "theme", "_ga"],
    mouseMovement: [{ x: 10.2, y: 20.8, t: 1 }],
    utm: { utm_source: "campaign", evil: "drop" },
  };
  const clean = sanitizeClientSnapshot(dirty);
  assert(!("phone" in clean), "sanitize drops phone");
  assert(!("phoneHash" in clean), "sanitize drops phoneHash");
  assert(!("otp" in clean), "sanitize drops otp");
  assert(!("clipboardText" in clean), "sanitize drops clipboardText");
  assert(!("keystrokes" in clean), "sanitize drops keystrokes");
  assert(
    Array.isArray(clean.cookieNames) &&
      !(clean.cookieNames as string[]).includes("janark_sid"),
    "sanitize strips session cookie name",
  );
  assert(
    (clean.utm as Record<string, string>)?.utm_source === "campaign",
    "sanitize keeps utm_source",
  );

  const paste = sanitizeEventData("paste", { count: 1, text: "SECRET" });
  assert(paste?.count === 1, "paste event keeps count");
  assert(!("text" in (paste || {})), "paste event drops text");

  assert(isValidVisitorId("abcdefgh"), "visitorId min length ok");
  assert(!isValidVisitorId("short"), "visitorId rejects short");
  assert(!isValidVisitorId("has space!!"), "visitorId rejects junk");

  const ip1 = hashIp("1.2.3.4");
  const ip2 = hashIp("1.2.3.4");
  assert(ip1 === ip2, "IP hash stable");
  assert(ip1.length === 64, "IP hash sha256 hex");
  assert(ip1 !== "1.2.3.4", "IP hash not raw");

  // --- DB roundtrip ---
  const visitorId = `val${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const fakeReq = new Request("http://localhost:3000/api/telemetry/visit", {
    method: "POST",
    headers: {
      "user-agent": "JanarkValidate/1.0",
      "x-forwarded-for": "203.0.113.50",
      "x-forwarded-proto": "https",
      "cf-ipcountry": "IN",
      "accept-language": "en-IN",
    },
  });

  const result = await upsertVisitSession({
    req: fakeReq,
    visitorId,
    client: {
      browserName: "Chrome",
      deviceType: "desktop",
      currentUrl: "http://localhost:3000/unreleased/feed",
      entryPage: "/unreleased/feed",
      pageViews: 1,
      visitorKind: "new",
    },
    events: [
      { kind: "pageview", path: "/unreleased/feed", data: { path: "/feed" } },
      { kind: "paste", data: { count: 1, text: "should-not-store" } },
    ],
  });

  assert(Boolean(result.sessionId), "visit session created");

  const session = await prisma.visitSession.findUnique({
    where: { id: result.sessionId },
    include: { events: true },
  });
  assert(Boolean(session), "session readable from DB");
  assert(session?.visitorId === visitorId, "visitorId stored");
  assert(Boolean(session?.ipHash), "ipHash stored");
  assert(session?.ipHash !== "203.0.113.50", "raw IP not stored");
  assert(session?.country === "IN", "country from edge header");
  assert(!session?.phoneHash, "anonymous visit has no phoneHash");
  assert((session?.events.length ?? 0) >= 2, "events persisted");

  const pasteEvent = session?.events.find((e) => e.kind === "paste");
  const pasteData = pasteEvent ? JSON.parse(pasteEvent.dataJson || "{}") : {};
  assert(!("text" in pasteData), "DB paste event has no text");

  const snap = JSON.parse(session?.snapshotJson || "{}");
  assert(!("phone" in snap), "snapshot has no phone");
  assert(snap.ipHash === session?.ipHash, "snapshot includes hashed IP");
  assert(!String(JSON.stringify(snap)).includes("203.0.113.50"), "snapshot has no raw IP");

  // --- OTP-style link ---
  const phoneHash = createHash("sha256")
    .update("validate-phone-hash")
    .digest("hex");
  await linkVisitorToPhone({
    visitorId,
    phoneHash,
    anonId: "jn-validate",
  });

  const link = await prisma.visitorPhoneLink.findUnique({
    where: {
      visitorId_phoneHash: { visitorId, phoneHash },
    },
  });
  assert(Boolean(link), "VisitorPhoneLink created");
  assert(link?.anonId === "jn-validate", "link stores anonId");

  const linked = await prisma.visitSession.findUnique({
    where: { id: result.sessionId },
  });
  assert(linked?.phoneHash === phoneHash, "session phoneHash linked after OTP");
  assert(linked?.anonId === "jn-validate", "session anonId linked");

  // --- product interactions ---
  const {
    recordInteraction,
    sanitizeInteractionProps,
    isAllowedInteractionName,
  } = await import("../apps/web/src/lib/interactions");
  assert(isAllowedInteractionName("search.query"), "search.query allowlisted");
  assert(
    !isAllowedInteractionName("evil.exfiltrate"),
    "unknown interaction names rejected",
  );
  const dirtyProps = sanitizeInteractionProps(
    { q: "roads", phone: "+91", otp: "123456", nested: { token: "x", ok: 1 } },
    4000,
  );
  assert(Boolean(dirtyProps), "interaction props serialize");
  assert(!dirtyProps!.includes("phone"), "interaction props drop phone");
  assert(!dirtyProps!.includes("otp"), "interaction props drop otp");

  const ix = await recordInteraction({
    name: "search.query",
    visitorId,
    anonId: "jn-validate",
    path: "/unreleased",
    props: { q: "water", source: "validate" },
  });
  assert(ix.ok && Boolean(ix.id), "InteractionEvent persisted");
  const ixRow = await prisma.interactionEvent.findUnique({
    where: { id: ix.id! },
  });
  assert(ixRow?.name === "search.query", "interaction name stored");
  assert(!ixRow?.propsJson?.includes("phone"), "stored props stay clean");

  // cleanup test rows
  await prisma.interactionEvent.deleteMany({ where: { visitorId } });
  await prisma.visitEvent.deleteMany({ where: { visitorId } });
  await prisma.visitSession.deleteMany({ where: { visitorId } });
  await prisma.visitorPhoneLink.deleteMany({ where: { visitorId } });

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll telemetry validation checks passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
