import { DATABASE_PATH, DEFAULT_ORIGIN } from "../src/config.mjs";
import { openDatabase } from "../src/database.mjs";
import { signEventBody } from "../src/receiver/events.mjs";

const database = openDatabase(DATABASE_PATH);
const prior = database.prepare(`
  SELECT e.raw_body, g.correlation_id
  FROM events e
  JOIN grants g ON g.grant_id = e.grant_id
  ORDER BY e.received_at DESC
  LIMIT 1
`).get();
database.close();

if (!prior) throw new Error("No prior event is available to replay");
const timestamp = String(Math.floor(Date.now() / 1000));
const signature = signEventBody(prior.raw_body, timestamp);
const response = await fetch(`${DEFAULT_ORIGIN}/api/receiver/events`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Correlation-Id": prior.correlation_id,
    "X-Event-Timestamp": timestamp,
    "X-Event-Signature": signature,
  },
  body: prior.raw_body,
});
const delivery = await response.json();
if (!response.ok) throw new Error(delivery.error ?? `Replay failed with ${response.status}`);

process.stdout.write(`${JSON.stringify({ duplicate_delivery: delivery }, null, 2)}\n`);
