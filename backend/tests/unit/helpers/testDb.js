import sqlite from "sqlite3";
import fs from "fs";
import os from "os";
import path from "path";

// Subset of the schema in init-db.js needed by the DAO.
// init-db.js can't be imported (it runs on load and uses require), so keep this in sync with it.
const SCHEMA = `
CREATE TABLE services (
  sId          INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,
  tag          TEXT NOT NULL UNIQUE,
  service_time INTEGER NOT NULL CHECK (service_time > 0)
);

CREATE TABLE counters (
  cId  INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE tickets (
  tId        INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL,
  sId        INTEGER NOT NULL REFERENCES services(sId),
  issued_at  TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'waiting'
             CHECK (status IN ('waiting', 'processing', 'served')),
  served_at  TEXT,
  cId INTEGER REFERENCES counters(cId)
);

INSERT INTO services(sId, name, tag, service_time) VALUES
  (1, 'Shipping',            'S', 10),
  (2, 'Accounts management', 'A', 8),
  (3, 'Deposits',            'D', 5),
  (4, 'Payments',            'P', 4);
`;

// Creates a fresh database file in the OS temp dir and returns a handle to query it from the tests
export const createTestDb = () => {
    const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "oqm-test-")), "test.sqlite");
    const db = new sqlite.Database(dbPath);

    const exec = (sql) =>
        new Promise((resolve, reject) => db.exec(sql, (err) => (err ? reject(err) : resolve())));
    const all = (sql, params = []) =>
        new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
    const close = () =>
        new Promise((resolve, reject) => db.close((err) => (err ? reject(err) : resolve())));
    const remove = async () => {
        await close();
        fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
    };

    return { dbPath, init: () => exec(SCHEMA), exec, all, remove };
};
