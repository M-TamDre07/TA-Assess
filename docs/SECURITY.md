# Security Policy

## Supported versions

Security fixes should target the current `main` branch and the latest published deployment.

## Reporting a vulnerability

Please do not publish credentials, tokens, personal data, raw assessment answers, or a working exploit in a public issue. Use the repository's private security reporting feature when it is available, or contact the project maintainer through the contact channel published on the TA Assess website.

When reporting, include:

- affected page or endpoint;
- impact;
- minimal reproduction steps;
- affected browser/runtime;
- whether the issue requires an authenticated account;
- suggested mitigation, if known.

Do not include real user data in a report.

## Security model

TA Assess uses several layers:

- role-checked account sessions for administrator actions;
- signed assessment sessions at the Vercel gateway;
- server proof before the main Apps Script accepts assessment submissions when the shared secret is configured;
- HMAC-based report verification when `TA_VERIFY_SECRET` is configured;
- browser integrity signals, calibration, and bot-risk indicators as mitigations rather than proof of misconduct;
- repository CI and source integrity checks.

Browser controls cannot make an assessment impossible to manipulate. Security telemetry must not be treated as a psychological judgment or as conclusive evidence of cheating.

## Secrets

Never commit:

- `TA_ASSESS_SERVER_SECRET`;
- `TA_SERVER_SHARED_SECRET`;
- `TA_VERIFY_SECRET`;
- `TELEGRAM_BOT_TOKEN`;
- passwords or session tokens;
- `SPREADSHEET_ID` when it is intended to remain private.

Use Vercel environment variables and Google Apps Script Project Settings > Script Properties for server-side secrets.
