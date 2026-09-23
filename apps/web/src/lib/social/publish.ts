/**
 * Optional server-side outbound publishing.
 * Without credentials these return { skipped: true }.
 * Configure env vars from .env.example to enable.
 */

export async function maybePostToPostChannel(status: string) {
  const key = process.env.TWITTER_API_KEY;
  const secret = process.env.TWITTER_API_SECRET;
  const token = process.env.TWITTER_ACCESS_TOKEN;
  const tokenSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!key || !secret || !token || !tokenSecret) {
    return { skipped: true, reason: "Post API credentials not configured" };
  }

  // Placeholder for OAuth post create — wire provider SDK when keys are live
  return {
    skipped: true,
    reason:
      "Credentials present but post client not activated in this MVP. Share intent URL still works for users.",
    preview: status.slice(0, 120),
  };
}

export async function maybePostToFeedChannel(link: string, message: string) {
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageToken) {
    return { skipped: true, reason: "META_PAGE_ACCESS_TOKEN not configured" };
  }

  try {
    const res = await fetch("https://graph.facebook.com/v21.0/me/feed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pageToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, link }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: "Feed publish failed" };
    }
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function maybePostToChatChannel(text: string) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const to = process.env.WHATSAPP_NOTIFY_TO; // optional test recipient

  if (!phoneId || !token || !to) {
    return {
      skipped: true,
      reason:
        "Chat API not fully configured (need phone id, token, WHATSAPP_NOTIFY_TO)",
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text.slice(0, 4000) },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: "Chat publish failed" };
    return { ok: true, data: { messages: (data as { messages?: unknown }).messages } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Photo publishing requires a business account + app review */
export async function maybePostToStoriesChannel(
  _caption: string,
  _imageUrl: string,
) {
  if (!process.env.META_PAGE_ACCESS_TOKEN) {
    return {
      skipped: true,
      reason:
        "Photo publishing needs META_PAGE_ACCESS_TOKEN + business account. Users can still copy the link to share.",
    };
  }
  return {
    skipped: true,
    reason:
      "Photo feed publishing requires media container flow; use copy-link share for now.",
  };
}
