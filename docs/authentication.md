# Authentication

## Model

| Rule | Detail |
|------|--------|
| Browse | Free (no login) |
| Write | Phone OTP (post, vote, comment, sign, flag, upload, share track, …) |
| Phone storage | Hash only (`PHONE_HASH_SALT`); never returned publicly |
| Public identity | `anonId` (`jn-xxxxxxxx`) |
| Session | httpOnly cookie `janark_sid` → `AuthSession` (token hashed at rest) |
| Secure cookie | Set only when site URL is `https://` |

## API

| Step | Endpoint |
|------|----------|
| Request OTP | `POST /api/auth/phone/request` |
| Verify OTP | `POST /api/auth/phone/verify` → sets `janark_sid` |
| Soft refresh | `GET /api/auth/me` |
| Logout | `POST /api/auth/logout` |

Local/demo: `EXPOSE_DEV_OTP=1` or compose `ALLOW_OTP_WITHOUT_SMS` returns a `devCode`. **Never** enable in production.

## Clients

| Platform | Session | Must send |
|----------|---------|-----------|
| Web | Browser cookie | Same-origin; Turnstile/honeypot when configured |
| Android | OkHttp persistent cookie jar | `Origin` / `Referer` from API base (maps emulator → localhost for allowlist) |
| iOS | `HTTPCookieStorage` | Same Origin/Referer semantics |

`voterKey` on write bodies is bound from the session server-side — clients must not treat a client-supplied hash as auth.

## Related

[SECURITY.md](../SECURITY.md) · [api.md](./api.md) · [mobile.md](./mobile.md)
