import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestDb } from "./helpers/testDb.js";
import { Service } from "../../models.js";

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

    // Known bug: after reject(err), dao.js keeps going and calls `rows.map` with `rows` undefined.
    // The TypeError is thrown inside the sqlite callback, so it can't be caught and would crash the server.
    // Skipped because that uncaught error also makes the whole test run fail. Unskip once dao.js returns after reject.
    it.skip("rejects when the query fails", async () => {
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

        // The code is the service tag followed by a number, e.g. "S1"
        expect(ticket.code).toMatch(/^S\d+$/);
        expect(new Date(ticket.timestamp).toISOString()).toBe(ticket.timestamp);
    });

    it("stores the ticket as waiting for the requested service", async () => {
        const ticket = await dao.newTicket(3, "D");

        const rows = await testDb.all("SELECT * FROM tickets");
        expect(rows).toHaveLength(1);
        // The returned code is the tag followed by the id of the saved row
        expect(ticket.code).toBe(`D${rows[0].tId}`);
        expect(rows[0]).toMatchObject({
            code: "D",
            sId: 3,
            issued_at: ticket.timestamp,
            status: "waiting",
            served_at: null,
            cId: null,
        });
    });

    // Known bug: SQLite doesn't enforce foreign keys unless `PRAGMA foreign_keys = ON` is run on the connection,
    // so a ticket for a service that doesn't exist is saved. Remove `.fails` once dao.js enables it.
    it.fails("rejects when the service does not exist", async () => {
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
