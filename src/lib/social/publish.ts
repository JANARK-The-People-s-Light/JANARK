/**
 * Optional server-side social publishing.
 * Without credentials these return { skipped: true }.
 * Configure env vars from .env.example to enable.
 */

export async function maybePostToX(status: string) {
  const key = process.env.TWITTER_API_KEY;
  const secret = process.env.TWITTER_API_SECRET;
  const token = process.env.TWITTER_ACCESS_TOKEN;
  const tokenSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!key || !secret || !token || !tokenSecret) {
    return { skipped: true, reason: "Twitter API credentials not configured" };
  }

  // Placeholder for OAuth 1.0a tweet create — wire twitter-api-v2 when keys are live
  return {
    skipped: true,
    reason:
      "Credentials present but X posting client not activated in this MVP. Share intent URL still works for users.",
    preview: status.slice(0, 120),
  };
}

export async function maybePostToFacebook(link: string, message: string) {
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageToken) {
    return { skipped: true, reason: "META_PAGE_ACCESS_TOKEN not configured" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/feed?access_token=${pageToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, link }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function maybePostToWhatsApp(text: string) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const to = process.env.WHATSAPP_NOTIFY_TO; // optional test recipient

  if (!phoneId || !token || !to) {
    return {
      skipped: true,
      reason:
        "WhatsApp Cloud API not fully configured (need phone id, token, WHATSAPP_NOTIFY_TO)",
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
    if (!res.ok) return { ok: false, error: data };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Instagram Content Publishing requires a Business/Creator account + Meta app review */
export async function maybePostToInstagram(_caption: string, _imageUrl: string) {
  if (!process.env.META_PAGE_ACCESS_TOKEN) {
    return {
      skipped: true,
      reason:
        "Instagram Graph publishing needs META_PAGE_ACCESS_TOKEN + IG business account. Users can still copy link to share to Stories.",
    };
  }
  return {
    skipped: true,
    reason:
      "Instagram feed publishing requires media container flow; use copy-link share for now.",
  };
}
