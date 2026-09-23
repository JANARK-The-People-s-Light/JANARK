/**
 * Static parity checks for Android + iOS thin clients vs web API surface.
 * Does not require JDK/Xcode — validates source presence and endpoint coverage.
 *
 * Run: npx tsx scripts/validate-native.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const rows: { name: string; ok: boolean; detail: string }[] = [];

function record(name: string, ok: boolean, detail: string) {
  rows.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} — ${detail}`);
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function listSwift(): string[] {
  const base = path.join(ROOT, "apps/ios/Janark");
  const out: string[] = [];
  function walk(dir: string) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".swift")) out.push(p);
    }
  }
  if (fs.existsSync(base)) walk(base);
  return out;
}

function listKotlin(): string[] {
  const base = path.join(
    ROOT,
    "apps/android/app/src/main/java/org/janark/app",
  );
  const out: string[] = [];
  function walk(dir: string) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".kt")) out.push(p);
    }
  }
  if (fs.existsSync(base)) walk(base);
  return out;
}

/** Web API route folders under apps/web/src/app/api */
function webApiRoutes(): string[] {
  const api = path.join(ROOT, "apps/web/src/app/api");
  const routes: string[] = [];
  function walk(dir: string, prefix: string) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p, `${prefix}/${ent.name}`);
      } else if (ent.name === "route.ts") {
        routes.push(prefix.replace(/^\//, ""));
      }
    }
  }
  walk(api, "");
  return routes.sort();
}

const REQUIRED_API_SNIPPETS = [
  "api/auth/phone/request",
  "api/auth/phone/verify",
  "api/auth/me",
  "api/auth/logout",
  "api/feed",
  "api/demands",
  "api/reports",
  "api/issues",
  "api/proposals",
  "api/votes",
  "api/shares",
  "api/notices",
  "api/discussions",
  "api/engage",
  "api/comments",
  "api/flags",
  "api/follow",
  "api/profiles",
  "api/dashboard",
  "api/social/share",
  "api/telemetry",
  "api/upload",
  "api/memes",
  "api/hashtags",
];

const ANDROID_REQUIRED_FILES = [
  "apps/android/app/src/main/java/org/janark/app/data/net/JanarkApi.kt",
  "apps/android/app/src/main/java/org/janark/app/data/net/Network.kt",
  "apps/android/app/src/main/java/org/janark/app/data/repo/JanarkRepository.kt",
  "apps/android/app/src/main/java/org/janark/app/ui/nav/JanarkNav.kt",
  "apps/android/app/src/main/java/org/janark/app/ui/components/Comments.kt",
  "apps/android/app/src/main/java/org/janark/app/ui/detail/DetailScreens.kt",
  "apps/android/README.md",
];

const IOS_REQUIRED_FILES = [
  "apps/ios/Janark.xcodeproj/project.pbxproj",
  "apps/ios/Janark/JanarkApp.swift",
  "apps/ios/Janark/AppContainer.swift",
  "apps/ios/Janark/Data/Net/APIClient.swift",
  "apps/ios/Janark/Data/Repo/JanarkRepository.swift",
  "apps/ios/Janark/UI/Nav/JanarkNav.swift",
  "apps/ios/Janark/UI/Components/Comments.swift",
  "apps/ios/Janark/UI/Detail/DetailScreens.swift",
  "apps/ios/Janark/Info.plist",
  "apps/ios/README.md",
];

const ANDROID_SCREENS = [
  "HomeScreen",
  "PetitionsScreen",
  "ReportsScreen",
  "IssuesScreen",
  "VotesScreen",
  "DiscussionsScreen",
  "MemesScreen",
  "NoticesScreen",
  "CreateScreen",
  "ProfileGate",
  "ActivityScreen",
  "SettingsScreen",
  "LoginScreen",
  "MemeDetailScreen",
  "PetitionDetailScreen",
  "ShareDetailScreen",
];

const IOS_SCREENS = [
  "HomeScreen",
  "PetitionsScreen",
  "ReportsScreen",
  "IssuesScreen",
  "VotesScreen",
  "DiscussionsScreen",
  "MemesScreen",
  "NoticesScreen",
  "CreateScreen",
  "ProfileScreen",
  "ActivityScreen",
  "SettingsScreen",
  "LoginScreen",
  "MemeDetailScreen",
  "PetitionDetailScreen",
  "ShareDetailScreen",
  "JanarkScaffold",
];

async function main() {
  // --- Structure ---
  for (const f of ANDROID_REQUIRED_FILES) {
    record(`Android file ${path.basename(f)}`, exists(f), f);
  }
  for (const f of IOS_REQUIRED_FILES) {
    record(`iOS file ${path.basename(f)}`, exists(f), f);
  }

  const ktFiles = listKotlin();
  const swiftFiles = listSwift();
  record("Android Kotlin sources", ktFiles.length >= 30, `${ktFiles.length} .kt files`);
  record("iOS Swift sources", swiftFiles.length >= 30, `${swiftFiles.length} .swift files`);

  const androidAll = ktFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const iosAll = swiftFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const androidApi = read(
    "apps/android/app/src/main/java/org/janark/app/data/net/JanarkApi.kt",
  );
  const iosApi = read("apps/ios/Janark/Data/Net/APIClient.swift");

  // --- API coverage ---
  for (const snip of REQUIRED_API_SNIPPETS) {
    const a = androidApi.includes(snip) || androidApi.includes(snip.replace(/\//g, ""));
    // Android uses path segments like "api/feed" — check loosely
    const aOk =
      androidApi.includes(`"${snip}"`) ||
      androidApi.includes(`"${snip}/`) ||
      androidApi.includes(`@GET("${snip}`) ||
      androidApi.includes(`@POST("${snip}`) ||
      androidApi.includes(`@PATCH("${snip}`) ||
      androidApi.includes(`@DELETE("${snip}`) ||
      androidApi.includes(`@GET("${snip}/`) ||
      androidApi.includes(`@POST("${snip}/`);
    // Simpler: substring match on path
    const aHas = androidApi.includes(snip);
    const iHas = iosApi.includes(snip);
    record(`Android API ${snip}`, aHas, aHas ? "declared" : "MISSING");
    record(`iOS API ${snip}`, iHas, iHas ? "declared" : "MISSING");
  }

  // --- Origin / cookie ---
  record(
    "Android Origin rewrite",
    androidAll.includes("canonicalOriginForHeaders") &&
      androidAll.includes("10.0.2.2"),
    "Network.kt emulator→localhost",
  );
  record(
    "iOS Origin rewrite",
    iosAll.includes("canonicalOriginForHeaders") && iosAll.includes("10.0.2.2"),
    "APIClient emulator→localhost",
  );
  record(
    "Android cookie jar",
    androidAll.includes("PersistentCookieJar") &&
      androidAll.includes("janark_sid"),
    "PersistentCookieJar + SESSION_COOKIE",
  );
  record(
    "iOS cookie storage",
    iosAll.includes("HTTPCookieStorage") && iosAll.includes("janark_sid"),
    "HTTPCookieStorage + session cookie name",
  );

  // --- Comment edit/delete ---
  record(
    "Android comment edit/delete UI",
    androidAll.includes("editComment") &&
      androidAll.includes("deleteComment") &&
      androidAll.includes("onEdit"),
    "Comments.kt",
  );
  record(
    "iOS comment edit/delete UI",
    iosAll.includes("editComment") &&
      iosAll.includes("deleteComment") &&
      (iosAll.includes("Editing") || iosAll.includes("editingId")),
    "Comments.swift",
  );

  // --- Meme detail ---
  record(
    "Android MemeDetailScreen",
    androidAll.includes("MemeDetailScreen") && androidAll.includes("meme/{id}"),
    "nav + detail",
  );
  record(
    "iOS MemeDetailScreen",
    iosAll.includes("MemeDetailScreen") &&
      (iosAll.includes("meme/") || iosAll.includes(".meme(")),
    "nav + detail",
  );

  // --- Screens ---
  for (const s of ANDROID_SCREENS) {
    record(`Android screen ${s}`, androidAll.includes(s), s);
  }
  for (const s of IOS_SCREENS) {
    record(`iOS screen ${s}`, iosAll.includes(s), s);
  }

  // --- Themes ---
  for (const theme of [
    "brand-day",
    "brand-warm",
    "brand-night",
    "monsoon",
    "ember-graphite",
  ]) {
    record(`Android theme ${theme}`, androidAll.includes(theme), theme);
    record(`iOS theme ${theme}`, iosAll.includes(theme), theme);
  }

  // --- iOS ATS / Info.plist ---
  const plist = read("apps/ios/Janark/Info.plist");
  record(
    "iOS ATS local networking",
    plist.includes("NSAllowsLocalNetworking") ||
      plist.includes("NSExceptionAllowsInsecureHTTPLoads"),
    "Info.plist allows local HTTP",
  );
  record(
    "iOS photo usage string",
    plist.includes("NSPhotoLibraryUsageDescription"),
    "PhotosPicker permission copy",
  );

  // --- pbxproj includes all swift ---
  const pbx = read("apps/ios/Janark.xcodeproj/project.pbxproj");
  const missingInPbx = swiftFiles
    .map((f) => path.basename(f))
    .filter((name) => !pbx.includes(name));
  record(
    "iOS pbxproj lists Swift sources",
    missingInPbx.length === 0,
    missingInPbx.length
      ? `missing: ${missingInPbx.slice(0, 8).join(", ")}`
      : `${swiftFiles.length} files referenced`,
  );

  // --- Web origin/session source ---
  const origin = read("apps/web/src/lib/origin.ts");
  const session = read("apps/web/src/lib/session.ts");
  record(
    "Web Origin emulator allowlist",
    origin.includes("10.0.2.2") && origin.includes("originsCompatible"),
    "origin.ts",
  );
  record(
    "Web Secure cookie HTTPS-only",
    session.includes('startsWith("https://")') &&
      session.includes("sessionCookieOptions"),
    "session.ts",
  );

  // --- Web API route inventory ---
  const routes = webApiRoutes();
  record(
    "Web API route.ts count",
    routes.length >= 30,
    `${routes.length} routes (${routes.slice(0, 5).join(", ")}…)`,
  );

  // --- Docs ---
  record("docs/mobile.md mentions iOS", read("docs/mobile.md").includes("apps/ios"), "mobile.md");
  record(
    "apps/ios/README has Simulator URL",
    read("apps/ios/README.md").includes("127.0.0.1"),
    "README",
  );
  record(
    "apps/android/README has emulator URL",
    read("apps/android/README.md").includes("10.0.2.2"),
    "README",
  );

  const failed = rows.filter((r) => !r.ok);
  console.log("");
  console.log(
    `${rows.length - failed.length}/${rows.length} passed, ${failed.length} failed`,
  );
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
