import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

// The test db is created by init-db.js itself, so the users and their password hashes
// are exactly the ones of the real app
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oqm-test-"));
process.env.DB_PATH = path.join(dir, "test.sqlite");

let dao;

beforeAll(async () => {
    execFileSync(process.execPath, ["init-db.js"], { env: process.env });
    dao = await import("../../dao-users.js");
});

afterAll(() => {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch {
        // On Windows the file can't be deleted while dao-users.js still has its connection open
    }
});

describe("getUser", () => {
    it("returns the user without the password when the credentials are correct", async () => {
        const user = await dao.getUser("counter1", "password");

        expect(user).toEqual({ id: 1, username: "counter1", role: "officer", cId: 1 });
    });

    it("returns false when the password is wrong", async () => {
        expect(await dao.getUser("counter1", "wrong")).toBe(false);
    });

    it("returns false when the user does not exist", async () => {
        expect(await dao.getUser("nobody", "password")).toBe(false);
    });
});
