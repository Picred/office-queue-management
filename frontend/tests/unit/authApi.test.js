import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

// api.js opens its WebSocket as soon as it is imported: replace it with one that never connects,
// the authentication functions only use fetch
class IdleWebSocket {
    addEventListener() {}
}

let api;

beforeAll(async () => {
    vi.stubGlobal("WebSocket", IdleWebSocket);
    api = await import("../../src/API/api.js");
});

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
});

// Builds the response that fetch would return
const reply = (status, body) => ({ ok: status < 400, status, json: async () => body });

const user = { id: 1, username: "counter1", role: "officer", cId: 1 };

describe("login", () => {
    it("sends the credentials with the session cookie and resolves with the user", async () => {
        vi.mocked(fetch).mockResolvedValue(reply(201, user));

        await expect(api.login({ username: "counter1", password: "password" })).resolves.toEqual(user);

        const [url, options] = vi.mocked(fetch).mock.calls[0];
        expect(url).toBe("http://localhost:3001/api/sessions");
        expect(options).toMatchObject({ method: "POST", credentials: "include" });
        expect(JSON.parse(options.body)).toEqual({ username: "counter1", password: "password" });
    });

    it("rejects with the message of the server when the credentials are wrong", async () => {
        vi.mocked(fetch).mockResolvedValue(reply(401, { error: "Incorrect username or password." }));

        await expect(api.login({ username: "counter1", password: "wrong" }))
            .rejects.toThrow("Incorrect username or password.");
    });
});

describe("getUserInfo", () => {
    it("resolves with null when nobody is logged in", async () => {
        vi.mocked(fetch).mockResolvedValue(reply(401, { error: "Not authenticated" }));

        await expect(api.getUserInfo()).resolves.toBeNull();
    });
});
