# Re-entry SDK Test Workspace

<a href="https://youtu.be/lovFAAftKeU">
  <img src="https://img.youtube.com/vi/lovFAAftKeU/maxresdefault.jpg" alt="Watch the Re-entry demo on YouTube" width="100%" />
</a>

## What is Re-entry?

Re-entry complements WebMCP by helping an agent come back to a website after a person has approved
the next step. WebMCP gives agents a structured way to work with the web; Re-entry adds the small
return path that helps close the loop between agents and the internet.

The goal is modest: keep the website in control, keep the human in the loop, and stop the agent from
waiting by the browser door forever. It is still an early project, so expect useful code, a few sharp
edges, and probably at least one TODO pretending to be architecture.

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
