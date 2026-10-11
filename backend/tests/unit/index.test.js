import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

// index.js starts a WebSocketServer as soon as it is imported:
// replace it with a fake that just stores the "connection" handler, so no real port is opened
const server = vi.hoisted(() => ({ onConnection: null }));

vi.mock("ws", () => ({
    WebSocketServer: vi.fn(function () {
        this.on = (event, handler) => {
            if (event === "connection") server.onConnection = handler;
        };
    }),
}));

vi.mock("../../dao.js", () => ({
    getAllServices: vi.fn(),
    newTicket: vi.fn(),
}));

const { getAllServices, newTicket } = await import("../../dao.js");

// Fake client socket: records what the server sends and exposes the handlers it registers
const connectClient = () => {
    const handlers = {};
    const client = {
        send: vi.fn(),
        on: (event, handler) => { handlers[event] = handler; },
        sendToServer: (payload) =>
            handlers.message(Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload))),
        lastMessage: () => JSON.parse(client.send.mock.calls.at(-1)[0]),
    };
    server.onConnection(client);
    return client;
};

beforeAll(async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    await import("../../index.js");
});

beforeEach(() => {
    vi.mocked(getAllServices).mockReset();
    vi.mocked(newTicket).mockReset();
});

describe("connection", () => {
    it("sends a welcome message to a new client", () => {
        const client = connectClient();

        expect(client.send).toHaveBeenCalledTimes(1);
        expect(client.lastMessage().type).toBe("benvenuto");
    });
});

describe("get_services", () => {
    it("replies with the list of services", async () => {
        const services = [{ sId: 1, name: "Shipping", tag: "S", service_time: 10 }];
        getAllServices.mockResolvedValue(services);
        const client = connectClient();

        await client.sendToServer({ action: "get_services" });

        expect(client.lastMessage()).toEqual({ type: "services_list", data: services });
    });

    it("replies with an error when the database fails", async () => {
        getAllServices.mockRejectedValue(new Error("db down"));
        const client = connectClient();

        await client.sendToServer({ action: "get_services" });

        expect(client.lastMessage()).toEqual({ type: "error", message: "Failed to retrieve services." });
    });
});

describe("new_ticket", () => {
    const services = [
        { sId: 1, name: "Shipping", tag: "S", service_time: 10 },
        { sId: 2, name: "Accounts management", tag: "A", service_time: 8 },
    ];

    beforeEach(() => {
        // index.js reads the services to check that sId and tag belong together
        getAllServices.mockResolvedValue(services);
    });

    it("creates the ticket for the requested service and replies with it", async () => {
        const ticket = { code: "A7", timestamp: "2026-10-07T09:00:00.000Z" };
        newTicket.mockResolvedValue(ticket);
        const client = connectClient();

        await client.sendToServer({ action: "new_ticket", sId: 2, tag: "A" });

        expect(newTicket).toHaveBeenCalledWith(2, "A");
        expect(client.lastMessage()).toEqual({ type: "new_ticket", data: ticket });
    });

    it("replies with an error when the tag doesn't belong to the service", async () => {
        const client = connectClient();

        await client.sendToServer({ action: "new_ticket", sId: 2, tag: "S" });

        expect(newTicket).not.toHaveBeenCalled();
        expect(client.lastMessage()).toEqual({ type: "error", message: "Service ID and tag don't match." });
    });

    it("replies with an error when the database fails", async () => {
        newTicket.mockRejectedValue(new Error("db down"));
        const client = connectClient();

        await client.sendToServer({ action: "new_ticket", sId: 2, tag: "A" });

        expect(client.lastMessage()).toEqual({ type: "error", message: "Failed to create ticket." });
    });
});

describe("invalid requests", () => {
    it("replies with an error for an unknown action", async () => {
        const client = connectClient();

        await client.sendToServer({ action: "do_something" });

        expect(client.lastMessage()).toEqual({ type: "error", message: "Unknown service." });
    });

    it("replies with an error instead of crashing on a message that is not JSON", async () => {
        const client = connectClient();

        await expect(client.sendToServer("not json")).resolves.toBeUndefined();
        expect(client.lastMessage().type).toBe("error");
    });
});
