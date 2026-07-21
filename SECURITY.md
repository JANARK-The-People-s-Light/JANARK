# Security Policy

## Supported versions

Security fixes are prioritized for the latest `main` (default) branch of this
repository. If you run a fork or pinned release, please rebase or cherry-pick
fixes promptly.

## Reporting a vulnerability

Janark handles phone OTP hashes, anonymity IDs, and civic user content. Please
report security issues **privately** so we can fix them before public disclosure.

**Do not** open a public GitHub issue for:

- Authentication / OTP bypass
- Exposure of phone numbers or hashes
- Injection, XSS, SSRF, or privilege escalation
- Data leaks involving citizen content or PII

### How to report

1. Prefer **GitHub Security Advisories** (private) on the Janark repository, if
   enabled: *Security → Report a vulnerability*.
2. Or email the maintainers via the contact published on the
   [JANARK - The People's Light](https://github.com/JANARK-The-People-s-Light)
   organization profile.

Include:

- A clear description of the issue and impact
- Steps to reproduce (PoC)
- Affected paths, commits, or environment (local / production)
- Whether you plan to disclose publicly and on what timeline

### What to expect

- Acknowledgement when a maintainer can respond
- An initial assessment (accepted, needs more info, or declined)
- A fix or mitigation plan when the report is confirmed
- Credit in release notes if you want to be named (optional)

We ask that you give us a reasonable window to ship a fix before public
write-ups.

## Non-security bugs

Use public GitHub Issues for ordinary bugs and feature requests. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Safe local development

- Never commit `.env` or real `PHONE_HASH_SALT` values
- Use `EXPOSE_DEV_OTP=1` only on local machines
- Treat demo / seed data as non-production

## License

This project is licensed under the [Apache License 2.0](LICENSE). Security fixes
are contributions under the same license.
