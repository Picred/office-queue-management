import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

// api.js opens its WebSocket as soon as it is imported: replace WebSocket with a fake
// that opens right away, records what is sent and lets the tests play the server's replies
class FakeWebSocket {
    static instance = null;

    constructor() {
        this.listeners = {};
        this.sent = [];
        FakeWebSocket.instance = this;
        queueMicrotask(() => this.emit("open", {}));
    }

    addEventListener(type, handler) {
        (this.listeners[type] ??= new Set()).add(handler);
    }

    removeEventListener(type, handler) {
        this.listeners[type]?.delete(handler);
    }

    send(message) {
        this.sent.push(JSON.parse(message));
    }

    emit(type, event) {
        [...(this.listeners[type] ?? [])].forEach((handler) => handler(event));
    }

    reply(payload) {
        this.emit("message", { data: JSON.stringify(payload) });
    }
}

let api;
let socket;

beforeAll(async () => {
    vi.stubGlobal("WebSocket", FakeWebSocket);
    api = await import("../../src/API/api.js");
    socket = FakeWebSocket.instance;
});

beforeEach(() => {
    socket.sent = [];
});

const requestSent = () => vi.waitFor(() => expect(socket.sent).toHaveLength(1));

describe("getServices", () => {
    it("asks the server for the services and resolves with the list", async () => {
        const services = [{ sId: 1, name: "Shipping", tag: "S", service_time: 10 }];
        const result = api.getServices();
        await requestSent();

        expect(socket.sent[0]).toEqual({ action: "get_services" });
        socket.reply({ type: "services_list", data: services });
        await expect(result).resolves.toEqual(services);
    });

    it("rejects with the message of the server's error", async () => {
        const result = api.getServices();
        await requestSent();

        socket.reply({ type: "error", message: "Failed to retrieve services." });

        await expect(result).rejects.toThrow("Failed to retrieve services.");
    });
});

describe("createTicket", () => {
    it("sends the service id and tag and resolves with the new ticket", async () => {
        const ticket = { code: "S1", timestamp: "2026-10-07T09:00:00.000Z" };
        const result = api.createTicket(1, "S");
        await requestSent();

        expect(socket.sent[0]).toEqual({ action: "new_ticket", sId: 1, tag: "S" });
        socket.reply({ type: "new_ticket", data: ticket });
        await expect(result).resolves.toEqual(ticket);
    });

    it("rejects with the message of the server's error", async () => {
        const result = api.createTicket(1, "X");
        await requestSent();

        socket.reply({ type: "error", message: "Service ID and tag don't match." });

        await expect(result).rejects.toThrow("Service ID and tag don't match.");
    });
});
