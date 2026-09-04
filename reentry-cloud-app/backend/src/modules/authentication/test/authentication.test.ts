import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { createApp } from "../../../app";
import { clearTestAccounts } from "../../../test/helper";

const app = createApp();
const email = `cloud-receiver-2-${Date.now()}@example.com`;
const password = "correct horse battery staple";

describe("Cloud Receiver 2 authentication", () => {
  const userAgent = request.agent(app);
  const developerAgent = request.agent(app);

  beforeAll(async () => {
    await clearTestAccounts(email);
  });

  afterAll(async () => {
    await clearTestAccounts(email);
  });

  it("registers and authenticates a user", async () => {
    const register = await userAgent.post("/v1/auth/users/register").send({ email, password });

    expect(register.status).toBe(201);
    expect(register.body.data).toEqual({
      id: expect.any(String),
      email,
    });
    expect(register.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("user_session=")])
    );

    const me = await userAgent.get("/v1/auth/users/me");
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);
  });

  it("keeps developer authentication separate from user authentication", async () => {
    const register = await developerAgent
      .post("/v1/auth/developers/register")
      .send({ email, password });

    expect(register.status).toBe(201);
    expect(register.body.data).toEqual({
      id: expect.any(String),
      email,
    });
    expect(register.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("developer_session=")])
    );

    const me = await developerAgent.get("/v1/auth/developers/me");
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);

    const wrongSurface = await developerAgent.get("/v1/auth/users/me");
    expect(wrongSurface.status).toBe(401);
  });

  it("rejects invalid credentials and malformed input", async () => {
    const invalidLogin = await request(app)
      .post("/v1/auth/users/login")
      .send({ email, password: "wrong password" });
    expect(invalidLogin.status).toBe(401);
    expect(invalidLogin.body.error).toBe("INVALID_CREDENTIALS");

    const invalidInput = await request(app)
      .post("/v1/auth/developers/login")
      .send({ email: "not-an-email", password: "short" });
    expect(invalidInput.status).toBe(400);
    expect(invalidInput.body.error).toBe("VALIDATION_ERROR");
  });
});
