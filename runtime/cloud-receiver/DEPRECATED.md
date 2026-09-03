# Deprecated Cloud Receiver Preview

This package is retired as of 2026-09-02. Do not use it for a new integration, production traffic,
credentials, or durable application data.

The source and tests remain in the repository as historical evidence. The default Vercel entry point
returns `410 receiver_deprecated`; historical tests may explicitly opt into the factory only to
exercise the old behavior.

The former hosted alias may remain reachable until a separately authorized Vercel redeploy or
archival action. A reachable alias is not a supported service. The reusable contracts remain in
[`reentry-core/`](../../reentry-core/) and a future replacement must be introduced through a new
decision and verification record.
