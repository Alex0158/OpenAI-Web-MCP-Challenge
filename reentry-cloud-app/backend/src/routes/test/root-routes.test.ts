import request from "supertest";
import { afterAll, describe, expect, it } from "@jest/globals";
import { createApp } from "../../app";
import { appConfig } from "../../config/config";
import { prisma } from "../../db";

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("root browser handoff routes", () => {
  it("redirects account pages to the configured frontend and keeps only safe next paths", async () => {
    const expectedRegister = new URL("/user-register", appConfig.frontendUrl);
    expectedRegister.searchParams.set("next", "/user-dashboard");

    const register = await request(app).get("/user-register?next=%2Fuser-dashboard");
    expect(register.status).toBe(302);
    expect(register.headers.location).toBe(expectedRegister.toString());

    const login = await request(app).get("/user-login?next=https%3A%2F%2Fevil.example");
    expect(login.status).toBe(302);
    expect(login.headers.location).toBe(new URL("/user-login", appConfig.frontendUrl).toString());
  });
});
