# Re-entry Cloud Web App

This is the frontend code copied from the separate SaaS boilerplate checkout for
`Eyad/Full-Integration` testing. It contains the Cloud web UI, including consent, user dashboard,
developer dashboard, documentation, and device-pairing pages.

It is intentionally copied as a standalone frontend only. The SaaS repository, backend source,
Git metadata, dependencies, build output, and runtime environment files are not included here.
The small `shared/` package contains the type declarations required by the frontend API client.

## Run locally

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_BACKEND_URL` in `.env.local` to the separately running Cloud Receiver backend.
Never commit `.env.local` or credentials.

## Verify

```sh
npm run type-check
npm run lint
npm run build
```
