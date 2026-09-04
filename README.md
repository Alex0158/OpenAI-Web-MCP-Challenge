# Re-entry SDK Test Workspace

This branch is intentionally reduced to the smallest local test surface for the Re-entry SDK
consent flow. It contains the test consumer, the Host SDK source, the Local Connector source, and
the shared protocol package they use.

## Root structure

```text
reentry-sdk-test-app/   Next.js test consumer; stops after approved consent
reentry-cloud-app/
  frontend/              Cloud web frontend copied for full-integration testing
  backend/               Cloud Receiver v2 backend, Prisma schema, and API
reentry-host-sdk/       @4xeoz/re-entry-sdk Host package source and tests
reentry-local-connector/ Local Connector package source and tests
reentry-core/           Shared protocol and contract kernel dependency
```

The app intentionally does not register a WebMCP tool, send a later Event, update workflow state,
launch an Agent, or provide a follow-up path. It only requests consent, confirms approval, and
keeps an opaque continuation in the test server's in-memory placeholder.

The broader SaaS boilerplate repository, Git metadata, and unrelated services are intentionally
excluded from this branch. The Cloud frontend and backend are included as standalone packages
under `reentry-cloud-app/`; the frontend must point at the backend's running origin. Keep
`.env.local`, dependency folders, build output, and other machine state untracked.

## Quick verification

```sh
cd reentry-core && npm test
cd ../reentry-host-sdk && npm run verify
cd ../reentry-sdk-test-app && npm test && npm run lint && npm run build
```

The Local Connector's source and unit tests are retained, but its legacy local pairing test needs a
separate Cloud Receiver checkout and is not expected to pass in this reduced branch by itself.
