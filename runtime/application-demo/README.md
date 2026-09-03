# Application review sample Host

> The Cloud Receiver implementation used by this sample is deprecated historical evidence. Keep
> this package for local protocol replay only; do not use it or its former hosted alias for new
> integrations or production traffic. See [ADR-0032](../../Docs/Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md).

This package is a small website that uses the real local Host SDK, Re-entry Receiver, and Local
Connector contracts. It is a sample integration, not the selected final product.

```text
Applicant enables Re-entry
-> applicant submits the Host form
-> reviewer approves later
-> Host commits APPROVED
-> Host SDK sends application.approved
-> Re-entry creates one delivery
-> local Connector claims it
-> deterministic evidence Agent prepares the next-stage plan
-> Host proves the effect
-> Connector acknowledges
-> applicant alone may accept the plan
```

The application form remains in the Host's local JSON record. Re-entry receives protocol metadata,
not the applicant's name, email, project, or summary.

## Run it

Use Node 24 or newer:

```sh
cd runtime/application-demo
npm start
```

Open the printed `applicant_url` in a browser. Keep the terminal running.

1. Click **Enable Re-entry**, review the SDK prompt, and approve it.
2. Complete and submit the application.
3. Open the printed `reviewer_url` in another tab and click **Approve application**.
4. Return to the applicant tab. Within about one second, the next-stage plan should appear and the
   delivery should read `ACKNOWLEDGED`.
5. Click **Accept next stage** only when you want to cross the final human boundary.

Press `Ctrl-C` to stop both local services. A fresh temporary state directory is used by default.
To choose disposable ports or state explicitly:

```sh
npm start -- --host-port 43220 --receiver-port 43221 --state-dir /absolute/path/to/fresh-state
```

## What is real and what is a fixture

Real in this local proof: Host SDK signing, consent prompt, Receiver-owned Grant, SQLite delivery,
outbound Connector claim, independent Host-effect verification, acknowledgement, durable Host
record, stale-write checks, and human-only final acceptance.

Fixture-only: Connector pairing is auto-approved at startup and the Agent Adapter deterministically
prepares the plan in process. This does not claim supported Codex wake, browser acquisition,
production identity, public hosting, or a production deployment.
