import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { getUser } from "../../dao-users.js";

// index.js also starts the WebSocket server and uses dao.js: replace them, so no port or db is opened
vi.mock("ws", () => ({ WebSocketServer: vi.fn(function () { this.on = vi.fn(); }) }));
vi.mock("../../dao.js", () => ({ getAllServices: vi.fn(), newTicket: vi.fn() }));
vi.mock("../../dao-users.js", () => ({ getUser: vi.fn() }));

const { app } = await import("../../index.js");

const user = { id: 1, username: "counter1", role: "officer", cId: 1 };
const credentials = { username: "counter1", password: "password" };

beforeEach(() => {
    vi.mocked(getUser).mockReset();
});

describe("POST /api/sessions", () => {
    it("logs in and returns the user when the credentials are correct", async () => {
        vi.mocked(getUser).mockResolvedValue(user);

        const response = await request(app).post("/api/sessions").send(credentials);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(user);
        expect(getUser).toHaveBeenCalledWith("counter1", "password");
    });

    it("replies 401 when the credentials are wrong", async () => {
        vi.mocked(getUser).mockResolvedValue(false);

        const response = await request(app).post("/api/sessions").send(credentials);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Incorrect username or password." });
    });

    it("replies 500 when the database fails", async () => {
        vi.mocked(getUser).mockRejectedValue(new Error("SQLITE_ERROR"));

        const response = await request(app).post("/api/sessions").send(credentials);

        expect(response.status).toBe(500);
    });
});

describe("GET /api/sessions/current", () => {
    it("replies 401 when nobody is logged in", async () => {
        const response = await request(app).get("/api/sessions/current");

        expect(response.status).toBe(401);
    });

    it("returns the logged in user, until the logout", async () => {
        vi.mocked(getUser).mockResolvedValue(user);
        // The agent keeps the session cookie between the requests, like the browser
        const agent = request.agent(app);
        await agent.post("/api/sessions").send(credentials);

        const current = await agent.get("/api/sessions/current");
        expect(current.status).toBe(200);
        expect(current.body).toEqual(user);

        await agent.delete("/api/sessions/current");

        const afterLogout = await agent.get("/api/sessions/current");
        expect(afterLogout.status).toBe(401);
    });
});
