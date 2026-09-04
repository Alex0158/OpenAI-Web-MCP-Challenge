# REENTRY — Closing the Loop for MCP-Powered AI Agents

> 🌟 **Highly recommended:** Start with the
> [complete REENTRY step-by-step guide](https://game.sleepless-kingdom.com/OpenAI-WebMCP-Challenge-Judge-Guide).
> It brings the documentation, videos, screenshots, setup instructions, and full project story
> together in one place.

<h3 align="center">▶️ Watch the REENTRY demo on YouTube</h3>

<a href="https://youtu.be/lovFAAftKeU">
  <img src="https://img.youtube.com/vi/lovFAAftKeU/maxresdefault.jpg?v=20260904-3" alt="Watch the REENTRY demo on YouTube" width="100%" />
</a>

<p align="center">
  <a href="https://www.npmjs.com/package/@4xeoz/re-entry-sdk"><strong>Host SDK on npm</strong></a>
  &nbsp;·&nbsp;
  <a href="https://www.npmjs.com/package/@4xeoz/re-entry"><strong>Local Connector on npm</strong></a>
  &nbsp;·&nbsp;
  <a href="https://youtu.be/lovFAAftKeU"><strong>Watch the demo</strong></a>
</p>

## 🌐 What is REENTRY?

A website changes after the agent leaves. Then what?

WebMCP gives AI agents a structured way to understand and use websites. REENTRY explores the next
part of that journey: how a website can bring an agent back when a person approves something, a
process finishes, or new work is ready.

We are not building another product that simply uses WebMCP. We are building for developers
working with WebMCP — a return path they can add to the experiences they already own.

The idea is simple: the website keeps control, the person stays in the loop, and the agent gets a
clear reason to return. Less "agent magic," more useful continuity.

REENTRY is still early, and that is part of the point. This repository is a working exploration of
how MCP-enabled websites, AI agents, and real-world events might stay connected after the first
interaction ends. The interesting part is how the pieces connect.

## 🧭 Repository map

One loop needs a few distinct pieces. This branch brings them into one workspace:

### ☁️ `reentry-cloud-app/`

The hosted side of REENTRY.

- `frontend/` — the web experience for users and developers, including accounts, devices,
  contracts, API keys, and the SDK guide.
- `backend/` — the Cloud Receiver service and database layer that coordinate consent, contracts,
  device connections, and queued work.

### 📦 `reentry-host-sdk/`

The source and tests for [`@4xeoz/re-entry-sdk`](https://www.npmjs.com/package/@4xeoz/re-entry-sdk).
Host applications use this package to connect their existing website flow to REENTRY without
moving private server credentials into the browser.

### 🔌 `reentry-local-connector/`

The source and tests for [`@4xeoz/re-entry`](https://www.npmjs.com/package/@4xeoz/re-entry). It
connects a user's local environment to the hosted REENTRY service so approved work can reach the
right machine.

### 🧠 `reentry-core/`

The shared foundation used by the SDK, Cloud Receiver, and Local Connector. It keeps the different
parts speaking the same language without making every application reinvent the rules.

### 🧪 `reentry-sdk-test-app/`

A deliberately simple Next.js application that behaves like a normal SDK consumer. It is the
place to test installation, request a contract-signing consent flow, confirm the result, and check
that the published package works as expected.

## 📦 Published packages

| Package | Purpose | Install |
| --- | --- | --- |
| [`@4xeoz/re-entry-sdk`](https://www.npmjs.com/package/@4xeoz/re-entry-sdk) | SDK for websites and Host applications | `npm install @4xeoz/re-entry-sdk` |
| [`@4xeoz/re-entry`](https://www.npmjs.com/package/@4xeoz/re-entry) | Local Connector and command-line tools | `npm install -g @4xeoz/re-entry` |

## 🛠️ Install and run locally

### Requirements

- Git
- Node.js 24 or newer
- npm
- PostgreSQL when running the Cloud backend
- macOS with Codex installed and signed in when testing the Local Connector

### 1. Clone this integration branch

```sh
git clone --branch Eyad/Full-Integration \
  https://github.com/Alex0158/OpenAI-Web-MCP-Challenge.git
cd OpenAI-Web-MCP-Challenge
```

### 2. Start with the SDK test app

This is the shortest path for trying the published Host SDK:

```sh
cd reentry-sdk-test-app
npm install
cp .env.example .env.local
npm run dev
```

Open `.env.local` and provide the Host origin, Receiver origin, Host signing key, key ID, and the
organization API key from the REENTRY Developer Dashboard. Keep this file private and never commit
it. Then open [http://localhost:3000](http://localhost:3000).

### 3. Run the complete Cloud app

Start the backend first:

```sh
cd reentry-cloud-app/backend
npm install
cp .env.example .env.local
```

Configure the backend `.env.local` with a PostgreSQL connection, a JWT secret, the frontend origin,
and the Receiver public URL. Then prepare the database and start the backend:

```sh
npx prisma migrate deploy
npm run dev
```

The backend runs on [http://localhost:4000](http://localhost:4000) by default.

In a second terminal, start the frontend:

```sh
cd reentry-cloud-app/frontend
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000` in the frontend `.env.local`, then open
[http://localhost:3000](http://localhost:3000).

### 4. Try the Local Connector

From the repository root:

```sh
cd reentry-local-connector
npm install
npm run verify
npm install --global .
re-entry install
```

The guided setup checks Node.js and Codex, asks which workspace Codex may use, opens the REENTRY
account page, and walks through pairing the Mac.

### 5. Verify the shared packages

```sh
cd reentry-core && npm run verify
cd ../reentry-host-sdk && npm run verify
cd ../reentry-sdk-test-app && npm test && npm run lint && npm run build
```

If you want the complete walkthrough instead of collecting clues from five terminal windows, use
the [recommended Judge Guide](https://game.sleepless-kingdom.com/OpenAI-WebMCP-Challenge-Judge-Guide).

## 🙂 A small note

This is an integration workspace, not a claim that every edge is perfectly polished. The pieces
are here so the full idea can be tested, challenged, improved, and occasionally asked why it needs
quite so many environment variables.

## ⚖️ License

REENTRY is available under the [Apache License 2.0](LICENSE). You may use, modify, and distribute
the project under the terms of that license.
