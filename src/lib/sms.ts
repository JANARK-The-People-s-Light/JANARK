/**
 * OTP SMS delivery adapters. Configure one provider via env.
 * Never log the OTP or full phone number.
 */

export type SmsResult =
  | { ok: true; provider: string }
  | { ok: false; error: string };

function e164FromNormalized(normalized: string): string {
  // normalizePhone returns digits with country code (e.g. 91xxxxxxxxxx)
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

async function sendTwilio(to: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    return { ok: false, error: "Twilio not configured" };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    },
  );
  if (!res.ok) {
    return { ok: false, error: "SMS provider rejected the request" };
  }
  return { ok: true, provider: "twilio" };
}

async function sendMsg91(to: string, otp: string): Promise<SmsResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) {
    return { ok: false, error: "MSG91 not configured" };
  }

  const mobile = to.replace(/^\+/, "");
  const res = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: templateId,
      short_url: "0",
      recipients: [{ mobiles: mobile, otp }],
    }),
  });
  if (!res.ok) {
    return { ok: false, error: "SMS provider rejected the request" };
  }
  return { ok: true, provider: "msg91" };
}

export function smsConfigured(): boolean {
  return (
    Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER,
    ) || Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID)
  );
}

/** Deliver OTP. Returns error if no provider and production-safe path required. */
export async function sendOtpSms(
  normalizedPhone: string,
  code: string,
): Promise<SmsResult> {
  const to = e164FromNormalized(normalizedPhone);
  const body = `Your Janark verification code is ${code}. Valid for 10 minutes. Do not share this code.`;

  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  ) {
    return sendTwilio(to, body);
  }
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    return sendMsg91(to, code);
  }

  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_OTP_WITHOUT_SMS === "1") {
    return { ok: true, provider: "none" };
  }
  return { ok: false, error: "SMS delivery is not configured" };
}
