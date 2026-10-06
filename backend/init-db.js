'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sqlite = require('sqlite3');

const DB_PATH = path.join(__dirname, 'db.sqlite');


const SERVICES = [
  // sId, name, tag, service_time (minutes)
  [1, 'Shipping',            'S', 10],
  [2, 'Accounts management', 'A', 8],
  [3, 'Deposits',            'D', 5],
  [4, 'Payments',            'P', 4],
];

// cId, name
const COUNTERS = [
  [1, 'Counter 1'],
  [2, 'Counter 2'],
  [3, 'Counter 3'],
  [4, 'Counter 4'],
];

// cId, sId
const COUNTER_SERVICES = [
  [1, 1], [1, 2],
  [2, 3], [2, 1],
  [3, 3], [3, 4],
  [4, 2], [4, 4], [4, 3],
];

// username, password, role, cId
const USERS = [
  ['counter1', 'password', 'officer', 1],
  ['counter2', 'password', 'officer', 2],
  ['counter3', 'password', 'officer', 3],
  ['counter4', 'password', 'officer', 4],
  ['manager',  'password', 'manager', null],
];


const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE services (
  sId          INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,
  tag          TEXT NOT NULL UNIQUE,
  service_time INTEGER NOT NULL CHECK (service_time > 0)   -- minutes
);

CREATE TABLE counters (
  cId  INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE counter_services (
  cId INTEGER NOT NULL REFERENCES counters(cId),
  sId INTEGER NOT NULL REFERENCES services(sId),
  PRIMARY KEY (cId, sId)
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

CREATE TABLE users (
  uId           INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('officer', 'administrator', 'manager')),
  cId INTEGER REFERENCES counters(cId)
);
`;


const hashPassword = (password, salt) =>
  crypto.scryptSync(password, salt, 32).toString('hex');

function run(db, sql, params = []) {
  return new Promise((resolve, reject) =>
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));
}
const exec = (db, sql) =>
  new Promise((resolve, reject) => db.exec(sql, err => (err ? reject(err) : resolve())));
const close = db =>
  new Promise((resolve, reject) => db.close(err => (err ? reject(err) : resolve())));


async function main() {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  const db = new sqlite.Database(DB_PATH);

  try {
    await exec(db, SCHEMA);
    await run(db, 'BEGIN');

    for (const s of SERVICES)
      await run(db, 'INSERT INTO services(sId, name, tag, service_time) VALUES (?,?,?,?)', s);
    for (const c of COUNTERS)
      await run(db, 'INSERT INTO counters(cId, name) VALUES (?,?)', c);
    for (const cs of COUNTER_SERVICES)
      await run(db, 'INSERT INTO counter_services(cId, sId) VALUES (?,?)', cs);
    for (const [username, password, role, cId] of USERS) {
      const salt = crypto.randomBytes(16).toString('hex');
      await run(
        db,
        'INSERT INTO users(username, password_hash, salt, role, cId) VALUES (?,?,?,?,?)',
        [username, hashPassword(password, salt), salt, role, cId]);
    }

    await run(db, 'COMMIT');
    console.log(`Database created at ${DB_PATH}`);
    console.log(`  ${SERVICES.length} services, ${COUNTERS.length} counters, ${USERS.length} users`);
  } catch (err) {
    await run(db, 'ROLLBACK').catch(() => {});
    console.error('Database creation failed:', err.message);
    process.exitCode = 1;
  } finally {
    await close(db);
  }
}

main();
