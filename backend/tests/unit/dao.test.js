import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb.js";
import { Service, Ticket, Queue } from "../../models.js";

const testDb = createTestDb();
let dao;

beforeAll(async () => {
    await testDb.init();
    // dao.js opens the DB when it is loaded, so DB_PATH must be set before importing it
    process.env.DB_PATH = testDb.dbPath;
    dao = await import("../../dao.js");
});

afterAll(async () => {
    await testDb.remove();
});

beforeEach(async () => {
    await testDb.exec("DELETE FROM tickets");
});

describe("getAllServices", () => {
    it("returns every service as a Service with all its fields", async () => {
        const services = await dao.getAllServices();

        expect(services).toHaveLength(4);
        expect(services.map((s) => s.tag)).toEqual(["S", "A", "D", "P"]);
        expect(services[0]).toEqual(new Service(1, "Shipping", "S", 10));
    });

    it("rejects when the query fails", async () => {
        // Make the query fail by hiding the table, then put it back
        await testDb.exec("ALTER TABLE services RENAME TO services_hidden");
        try {
            await expect(dao.getAllServices()).rejects.toThrow(/no such table/);
        } finally {
            await testDb.exec("ALTER TABLE services_hidden RENAME TO services");
        }
    });
});

describe("newTicket", () => {
    it("returns the ticket code and the issue timestamp", async () => {
        const ticket = await dao.newTicket(1, "S");

        // The code is the service tag followed by a number, e.g. "S001"
        expect(ticket.code).toMatch(/^S\d+$/);
        expect(new Date(ticket.timestamp).toISOString()).toBe(ticket.timestamp);
    });

    it("stores the ticket as waiting for the requested service", async () => {
        const ticket = await dao.newTicket(3, "D");

        const rows = await testDb.all("SELECT * FROM tickets");
        expect(rows).toHaveLength(1);
        // The code is the tag followed by the number of the ticket for that service today
        expect(ticket.code).toBe("D001");
        expect(rows[0]).toMatchObject({
            code: "D001",
            sId: 3,
            issued_at: ticket.timestamp,
            status: "waiting",
            served_at: null,
            cId: null,
        });
    });

    it("rejects when the service does not exist", async () => {
        await expect(dao.newTicket(99, "X")).rejects.toThrow(/FOREIGN KEY/);

        const rows = await testDb.all("SELECT * FROM tickets");
        expect(rows).toHaveLength(0);
    });

    it("rejects when the tag is missing", async () => {
        await expect(dao.newTicket(1, undefined)).rejects.toThrow(/NOT NULL/);

        const rows = await testDb.all("SELECT * FROM tickets");
        expect(rows).toHaveLength(0);
    });
});

// Local time of a day at hh:mm
const at = (hh, mm = 0, daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hh, mm, 0, 0);
    return d.toISOString();
};
 
// Inserts a ticket with an explicit id so the tests know which tId to expect
const addTicket = (tId, code, sId, issuedAt, status = "waiting") =>
    testDb.exec(
        `INSERT INTO tickets (tId, code, sId, issued_at, status)
         VALUES (${tId}, '${code}', ${sId}, '${issuedAt}', '${status}')`
    );
 
const codes = (queue) => queue.tickets.map((t) => t.code);
 
describe("getQueuesByCounter", () => {
    it("returns an empty array when nobody is waiting", async () => {
        expect(await dao.getQueuesByCounter(1)).toEqual([]);
    });
 
    it("returns an empty array for a counter that does not exist", async () => {
        await addTicket(1, "S001", 1, at(10));
 
        expect(await dao.getQueuesByCounter(99)).toEqual([]);
    });
 
    it("groups the waiting tickets by service, oldest first", async () => {
        // inserted out of order
        await addTicket(1, "S002", 1, at(10, 5));
        await addTicket(2, "A001", 2, at(10, 2));
        await addTicket(3, "S001", 1, at(10, 0));
 
        const queues = await dao.getQueuesByCounter(1);
 
        expect(queues).toHaveLength(2);
        const shipping = queues.find((q) => q.sId === 1);
        const accounts = queues.find((q) => q.sId === 2);
        expect(codes(shipping)).toEqual(["S001", "S002"]);
        expect(codes(accounts)).toEqual(["A001"]);
    });
 
    it("returns Queue objects holding Ticket objects with all their fields", async () => {
        await addTicket(7, "S001", 1, at(10));
 
        const queues = await dao.getQueuesByCounter(1);
 
        expect(queues).toStrictEqual([
            new Queue(1, "Shipping", 10, [new Ticket(7, "S001", at(10))]),
        ]);
    });
 
    it("includes the service time of each queue", async () => {
        await addTicket(1, "S001", 1, at(10));
        await addTicket(2, "A001", 2, at(10));
 
        const queues = await dao.getQueuesByCounter(1);
 
        expect(queues.map((q) => [q.serviceName, q.serviceTime]).sort())
            .toEqual([["Accounts management", 8], ["Shipping", 10]]);
    });
 
    it("ignores tickets issued on other days", async () => {
        await addTicket(1, "S001", 1, at(10, 0, 3));
        await addTicket(2, "S002", 1, at(10, 0, 1));
        await addTicket(3, "S001", 1, at(10));
 
        const queues = await dao.getQueuesByCounter(1);
 
        expect(queues).toHaveLength(1);
        expect(queues[0].tickets.map((t) => t.tId)).toEqual([3]);
    });
 
    it("ignores tickets that are not waiting", async () => {
        await addTicket(1, "S001", 1, at(10), "served");
        await addTicket(2, "S002", 1, at(10, 1), "processing");
        await addTicket(3, "S003", 1, at(10, 2), "waiting");
 
        const queues = await dao.getQueuesByCounter(1);
 
        expect(queues).toHaveLength(1);
        expect(codes(queues[0])).toEqual(["S003"]);
    });
 
    it("ignores the services the counter cannot serve", async () => {
        await addTicket(1, "S001", 1, at(10)); //served
        await addTicket(2, "D001", 3, at(10)); //NOT served
        await addTicket(3, "P001", 4, at(10)); //NOT served
 
        const queues = await dao.getQueuesByCounter(1);
 
        expect(queues.map((q) => q.sId)).toEqual([1]);
    });
 
    it("shows the same ticket to every counter that serves its service", async () => {
        await addTicket(1, "S001", 1, at(10));
 
        const forCounter1 = await dao.getQueuesByCounter(1);
        const forCounter2 = await dao.getQueuesByCounter(2);
        const forCounter3 = await dao.getQueuesByCounter(3);
 
        expect(forCounter1[0].tickets[0].tId).toBe(1);
        expect(forCounter2[0].tickets[0].tId).toBe(1);
        expect(forCounter3).toEqual([]);
    });
 
    it("orders tickets with the same issue time by ticket id", async () => {
        await addTicket(5, "S002", 1, at(10));
        await addTicket(4, "S001", 1, at(10));
 
        const queues = await dao.getQueuesByCounter(1);
 
        expect(queues[0].tickets.map((t) => t.tId)).toEqual([4, 5]);
    });
 
    it("does not change the tickets (read only)", async () => {
        await addTicket(1, "S001", 1, at(10));
 
        await dao.getQueuesByCounter(1);
 
        const rows = await testDb.all("SELECT status, cId, served_at FROM tickets");
        expect(rows).toEqual([{ status: "waiting", cId: null, served_at: null }]);
    });
});