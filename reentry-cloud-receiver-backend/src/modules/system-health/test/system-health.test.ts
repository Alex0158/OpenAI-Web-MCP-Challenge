import request from "supertest";
import { createApp } from "../../../app";
import { describe, it, expect } from "@jest/globals";

const app = createApp();

describe("GET /health", () => {
    it("200 returns ok status and uptime", async () => {
        const res = await request(app).get("/health");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.isOk).toBe("ok");
        expect(typeof res.body.data.uptime).toBe("number");
        expect(res.body.data.uptime).toBeGreaterThan(0);
    });
});
