import request from "supertest";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { createApp } from "../../../app";
import { prisma } from "../../../db";
import { canonicalJson } from "../../consent/manifest";

const app = createApp();
const claimToken = Buffer.alloc(32, 91).toString("base64url");

function expectProtocolHeaders(response: request.Response): void {
  expect(response.headers["content-type"]).toMatch(/^application\/json(?:; charset=utf-8)?$/);
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(response.headers.pragma).toBe("no-cache");
  expect(response.headers["x-content-type-options"]).toBe("nosniff");
  expect(response.headers.location).toBeUndefined();
  expect(Buffer.byteLength(response.text, "utf8")).toBeLessThanOrEqual(32 * 1_024);
  expect(response.text).toBe(canonicalJson(response.body));
}

describe("Cloud Receiver v2 transport and operations red tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("HTTP-001 bounds malformed JSON, content type, methods, and request bodies", async () => {
    const malformed = await request(app)
      .post("/v0.1/events")
      .set("Content-Type", "application/json")
      .send('{"body":');
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ error: { code: "http_body_invalid" } });

    const unsupportedType = await request(app)
      .post("/v0.1/events")
      .set("Content-Type", "text/plain")
      .send("not-json");
    expect(unsupportedType.status).toBe(415);
    expect(unsupportedType.body).toEqual({ error: { code: "http_content_type_invalid" } });

    const oversized = await request(app)
      .post("/v0.1/events")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ body: "x".repeat(17 * 1_024) }));
    expect(oversized.status).toBe(413);
    expect(oversized.body).toEqual({ error: { code: "http_body_too_large" } });

    const wrongMethod = await request(app).get("/v0.1/delivery-claims");
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.allow).toBe("POST");
    expect(wrongMethod.body).toEqual({ error: { code: "http_method_not_allowed" } });

    const disconnectWrongMethod = await request(app).get("/v0.1/connectors/disconnect");
    expect(disconnectWrongMethod.status).toBe(405);
    expect(disconnectWrongMethod.headers.allow).toBe("POST");
    expect(disconnectWrongMethod.body).toEqual({ error: { code: "http_method_not_allowed" } });

    const disconnectExtraField = await request(app)
      .post("/v0.1/connectors/disconnect")
      .set("Content-Type", "application/json")
      .send({ connector_token: "A".repeat(43), extra: true });
    expect(disconnectExtraField.status).toBe(400);
    expect(disconnectExtraField.body).toEqual({ error: { code: "http_body_invalid" } });
  });

  it("HTTP-002 keeps typed protocol failures bounded and stable", async () => {
    const invalidIdentity = await request(app)
      .post("/v0.1/delivery-claims")
      .set("Content-Type", "application/json")
      .send({ connector_token: "invalid-connector", claim_token: claimToken });
    expect(invalidIdentity.status).toBe(403);
    expect(invalidIdentity.body).toEqual({ error: { code: "connector_identity_invalid" } });
    expect(Object.keys(invalidIdentity.body)).toEqual(["error"]);

    const unknownRoute = await request(app)
      .post("/v0.1/not-a-protocol-route")
      .set("Content-Type", "application/json")
      .send({});
    expect(unknownRoute.status).toBe(404);
    expect(unknownRoute.body).toEqual({ error: { code: "http_route_not_found" } });

    jest.spyOn(prisma, "$transaction").mockRejectedValue({ code: "P2034" });
    const busy = await request(app)
      .post("/v0.1/delivery-claims")
      .set("Content-Type", "application/json")
      .send({ connector_token: "opaque-connector", claim_token: claimToken });
    expect(busy.status).toBe(503);
    expect(busy.headers["retry-after"]).toBe("1");
    expect(busy.body).toEqual({ error: { code: "receiver_busy" } });
    jest.restoreAllMocks();

    const encoded = await request(app)
      .post("/v0.1/events")
      .set("Content-Type", "application/json")
      .set("Content-Encoding", "gzip")
      .send({});
    expect(encoded.status).toBe(415);
    expect(encoded.body).toEqual({ error: { code: "http_content_type_invalid" } });
  });

  it("HTTP-003 keeps unexpected failures and logs free of secrets and stack details", async () => {
    const secretMarker = "raw-effect-token-http-003";
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await request(app)
      .post("/v0.1/events")
      .set("Content-Type", "application/json")
      .send(`{"effect_token":"${secretMarker}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: { code: "http_body_invalid" } });
    const logs = errorSpy.mock.calls.flat().map((value) => String(value)).join("\n");
    expect(response.text).not.toContain(secretMarker);
    expect(logs).not.toContain(secretMarker);
    expect(logs).not.toMatch(/Error|SyntaxError|at .*\(/);

    jest.spyOn(prisma, "$transaction").mockRejectedValue(new Error(secretMarker));
    const unexpected = await request(app)
      .post("/v0.1/delivery-claims")
      .set("Content-Type", "application/json")
      .send({ connector_token: "opaque-connector", claim_token: claimToken });
    expect(unexpected.status).toBe(500);
    expect(unexpected.body).toEqual({ error: { code: "receiver_internal_error" } });
    const allLogs = errorSpy.mock.calls.flat().map((value) => String(value)).join("\n");
    expect(unexpected.text).not.toContain(secretMarker);
    expect(allLogs).not.toContain(secretMarker);
    expect(allLogs).not.toMatch(/Error|SyntaxError|at .*\(/);
  });

  it("HTTP-004 separates process liveness from durable database readiness", async () => {
    const health = await request(app).get("/healthz");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: "ok" });

    const ready = await request(app).get("/readyz");
    expect(ready.status).toBe(200);
    expect(ready.body).toEqual({ status: "ready" });

    jest.spyOn(prisma, "$queryRaw").mockRejectedValue(new Error("database outage marker"));
    const unavailable = await request(app).get("/readyz");
    expect(unavailable.status).toBe(503);
    expect(unavailable.body).toEqual({ error: { code: "receiver_not_ready" } });

    const liveDuringOutage = await request(app).get("/healthz");
    expect(liveDuringOutage.status).toBe(200);
    expect(liveDuringOutage.body).toEqual({ status: "ok" });
  });

  it("HTTP-005 applies JSON, no-store, canonical, bounded responses to every v0.1 protocol route", async () => {
    const event = await request(app)
      .post("/v0.1/events")
      .set("Content-Type", "application/json")
      .send({});
    expect(event.status).toBe(400);
    expectProtocolHeaders(event);

    const claim = await request(app)
      .post("/v0.1/delivery-claims")
      .set("Content-Type", "application/json")
      .send({ connector_token: "invalid-connector", claim_token: claimToken });
    expect(claim.status).toBe(403);
    expectProtocolHeaders(claim);

    const acknowledgement = await request(app)
      .post("/v0.1/delivery-acknowledgements")
      .set("Content-Type", "application/json")
      .send({
        connector_token: "invalid-connector",
        delivery_id: "delivery-http-005",
        lease_token: claimToken,
        effect_token: "opaque-effect-http-005",
      });
    expect(acknowledgement.status).toBe(501);
    expectProtocolHeaders(acknowledgement);

    const disconnection = await request(app)
      .post("/v0.1/connectors/disconnect")
      .set("Content-Type", "application/json")
      .send({ connector_token: "A".repeat(43) });
    expect(disconnection.status).toBe(403);
    expectProtocolHeaders(disconnection);
  });
});
