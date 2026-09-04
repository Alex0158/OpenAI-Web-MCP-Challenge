import request from "supertest";
import { describe, expect, it } from "@jest/globals";

// Keep the deployment entrypoint outside the backend's src/rootDir build while
// loading the exact Vercel module at runtime for this smoke test.
const handler = require("../../../../api").default;

describe("Vercel backend handler", () => {
  it("exports the Express app without starting a listener", async () => {
    expect(typeof handler).toBe("function");

    const response = await request(handler).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
