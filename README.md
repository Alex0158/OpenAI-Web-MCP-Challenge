# REENTRY — Closing the Loop for MCP-Powered AI Agents

<a href="https://youtu.be/lovFAAftKeU">
  <img src="https://img.youtube.com/vi/lovFAAftKeU/maxresdefault.jpg" alt="Watch the REENTRY demo on YouTube" width="100%" />
</a>

<p align="center">
  <a href="https://www.npmjs.com/package/@4xeoz/re-entry-sdk"><strong>Host SDK on npm</strong></a>
  &nbsp;·&nbsp;
  <a href="https://www.npmjs.com/package/@4xeoz/re-entry"><strong>Local Connector on npm</strong></a>
  &nbsp;·&nbsp;
  <a href="https://youtu.be/lovFAAftKeU"><strong>Watch the demo</strong></a>
</p>

## What is REENTRY?

WebMCP helps AI agents understand and use the web. REENTRY explores what happens next: how an
agent can safely return when a website changes, a person approves something, or work is ready to
continue.

The vision is a web where useful agent workflows do not disappear the moment a browser session
ends. Websites stay in control, people stay in the loop, and agents get a clear path back instead
of staring patiently into the digital void.

REENTRY is still early and deliberately small. It is not trying to replace WebMCP; it is a
companion layer intended to help close the loop between MCP-enabled websites, AI agents, and the
real events that happen in between.

## Repository map

This branch brings the complete REENTRY test path into one workspace:

### `reentry-cloud-app/`

The hosted side of REENTRY.

- `frontend/` — the web experience for users and developers, including accounts, devices,
  contracts, API keys, and the SDK guide.
- `backend/` — the Cloud Receiver service and database layer that coordinate consent, contracts,
  device connections, and queued work.

### `reentry-host-sdk/`

The source and tests for [`@4xeoz/re-entry-sdk`](https://www.npmjs.com/package/@4xeoz/re-entry-sdk).
Host applications use this package to connect their existing website flow to REENTRY without
moving private server credentials into the browser.

### `reentry-local-connector/`

The source and tests for [`@4xeoz/re-entry`](https://www.npmjs.com/package/@4xeoz/re-entry). It
connects a user's local environment to the hosted REENTRY service so approved work can reach the
right machine.

### `reentry-core/`

The shared foundation used by the SDK, Cloud Receiver, and Local Connector. It keeps the different
parts speaking the same language without making every application reinvent the rules.

### `reentry-sdk-test-app/`

A deliberately simple Next.js application that behaves like a normal SDK consumer. It is the
place to test installation, request a contract-signing consent flow, confirm the result, and check
that the published package works as expected.

## Published packages

| Package | Purpose | Install |
| --- | --- | --- |
| [`@4xeoz/re-entry-sdk`](https://www.npmjs.com/package/@4xeoz/re-entry-sdk) | SDK for websites and Host applications | `npm install @4xeoz/re-entry-sdk` |
| [`@4xeoz/re-entry`](https://www.npmjs.com/package/@4xeoz/re-entry) | Local Connector and command-line tools | `npm install -g @4xeoz/re-entry` |

## A small note

This is an integration workspace, not a claim that every edge is perfectly polished. The pieces
are here so the full idea can be tested, challenged, improved, and occasionally asked why it needs
quite so many environment variables.
