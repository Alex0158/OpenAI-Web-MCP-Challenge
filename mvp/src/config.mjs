import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

export const MVP_ROOT = path.resolve(moduleDirectory, "..");
export const WORKFLOW_ID = "WF-001";
export const INITIAL_STATE = "INITIAL";
export const READY_STATE = "READY";
export const AUTHORIZED_EVENT = "WORKFLOW_READY";
export const HUMAN_BOUNDARY = "COMMIT_ARTIFACT";
export const DEFAULT_PORT = Number.parseInt(process.env.WEBMCP_MVP_PORT ?? "4317", 10);
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_ORIGIN = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
export const DATABASE_PATH = process.env.WEBMCP_MVP_DATABASE
  ? path.resolve(process.env.WEBMCP_MVP_DATABASE)
  : path.join(MVP_ROOT, "var", "p0.sqlite");
export const TRACE_PATH = process.env.WEBMCP_MVP_TRACE
  ? path.resolve(process.env.WEBMCP_MVP_TRACE)
  : path.join(MVP_ROOT, "evidence", "latest-trace.jsonl");
export const H1_DATABASE_PATH = path.join(MVP_ROOT, "var", "h1.sqlite");
export const H1_TRACE_PATH = path.join(MVP_ROOT, "evidence", "h1-latest-trace.jsonl");
export const H2_DATABASE_PATH = path.join(MVP_ROOT, "var", "h2-enrollment.sqlite");
export const H2_DESTINATION_DATABASE_PATH = process.env.WEBMCP_H2_DESTINATION_DATABASE
  ? path.resolve(process.env.WEBMCP_H2_DESTINATION_DATABASE)
  : path.join(MVP_ROOT, "var", "h2-destination.sqlite");
export const H2_TRACE_PATH = process.env.WEBMCP_H2_TRACE
  ? path.resolve(process.env.WEBMCP_H2_TRACE)
  : path.join(MVP_ROOT, "evidence", "h2-enrollment-latest-trace.jsonl");

// Fixed local-development keys make the validation run reproducible. They are not secrets.
export const MANIFEST_KEY_ID = "mvp-local-1";
export const MANIFEST_SECRET = "p0-manifest-development-key-only";
export const EVENT_SECRET = "p0-event-development-key-only";
export const MANIFEST_TTL_MS = 30 * 60 * 1000;
export const CONTEXT_CAPTURE_TTL_MS = 10 * 60 * 1000;
export const EVENT_CLOCK_SKEW_MS = 5 * 60 * 1000;
export const DELIVERY_MODE = process.env.WEBMCP_MVP_DELIVERY ?? "adapter";
export const DELIVERY_TICKET_TTL_MS = 5 * 60 * 1000;
export const DELIVERY_TICKET_SECRET = process.env.WEBMCP_H1_DELIVERY_TICKET_SECRET;
export const EFFECT_RECEIPT_SECRET = process.env.WEBMCP_H1_EFFECT_RECEIPT_SECRET;
export const DURABLE_ENROLLMENT_ENABLED = process.env.WEBMCP_H2_DURABLE_ENROLLMENT === "true";
export const H2_RECEIPT_SEALING_KEY = process.env.WEBMCP_H2_RECEIPT_SEALING_KEY;
export const H2_RECEIPT_KEY_ID = process.env.WEBMCP_H2_RECEIPT_KEY_ID ?? "h2-local-1";
export const H2_RECEIPT_LEASE_MS = 30 * 1000;
