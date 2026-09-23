import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveSessionFromRequest } from "@/lib/session";
import {
  DEFAULT_SETTINGS,
  normalizeSettingsBlob,
  parseSettingsJson,
  type UserSettingsBlob,
} from "@/lib/user-preferences";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function loadBlob(phoneHash: string): Promise<UserSettingsBlob> {
  const row = await prisma.phoneSettings.findUnique({
    where: { phoneHash },
  });
  if (!row) {
    return {
      preferences: { ...DEFAULT_SETTINGS.preferences },
      themeId: DEFAULT_SETTINGS.themeId,
    };
  }
  return parseSettingsJson(row.prefsJson);
}

/** GET — current user’s settings (requires login). */
export async function GET(req: Request) {
  const session = await resolveSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Log in to manage settings" }, { status: 401 });
  }

  const settings = await loadBlob(session.phoneHash);
  return NextResponse.json({ settings });
}

/**
 * PATCH — merge preferences and/or themeId for the logged-in user.
 * Body: { preferences?: Partial<UserPreferences>, themeId?: ThemeId }
 */
export async function PATCH(req: Request) {
  const session = await resolveSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Log in to manage settings" }, { status: 401 });
  }

  let body: {
    preferences?: Record<string, unknown>;
    themeId?: string;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const current = await loadBlob(session.phoneHash);
  const next = normalizeSettingsBlob({
    preferences: {
      ...current.preferences,
      ...(body.preferences ?? {}),
    },
    themeId: (body.themeId as UserSettingsBlob["themeId"]) ?? current.themeId,
  });

  await prisma.phoneSettings.upsert({
    where: { phoneHash: session.phoneHash },
    create: {
      phoneHash: session.phoneHash,
      prefsJson: JSON.stringify(next),
    },
    update: {
      prefsJson: JSON.stringify(next),
    },
  });

  return NextResponse.json({ settings: next });
}
