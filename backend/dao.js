import sqlite from "sqlite3";
import { Service, Ticket, Queue } from "./models.js";
import dayjs from "dayjs";

const db = new sqlite.Database(process.env.DB_PATH ?? "db.sqlite", (err) => {
    if (err) throw err;
})

db.run("PRAGMA foreign_keys = ON;", (err) => {
    if (err) {
        console.error("Error in foreign keys activation", err);
    } else {
        console.log("Successful foreign keys activatiom");
    }
});


export const getAllServices = () => {
    return new Promise((resolve,reject) => {
        const sql = `
        SELECT *
        FROM services
        `

        db.all(sql, [], (err,rows) => {
            if(err) return reject(err);

            const serviceList = rows.map((r)=> new Service(r.sId, r.name, r.tag, r.service_time))
            return resolve(serviceList)
        })
    })
}


export const newTicket = (sId, tag) => {
    return new Promise((resolve, reject) => {
        const issued_at = dayjs().toISOString();
        const sql = `
            INSERT INTO tickets (code, sId, issued_at, status, served_at, cId)
            SELECT ? || printf('%03d', COUNT(*) + 1), ?, ?, 'waiting', NULL, NULL
            FROM tickets
            WHERE sId = ?
              AND date(issued_at, 'localtime') = date('now', 'localtime')
        `;
        db.run(sql, [tag, sId, issued_at, sId], function (err) {
            if (err) return reject(err);

            db.get('SELECT code FROM tickets WHERE tId = ?', [this.lastID], (err2, row) => {
                if (err2) return reject(err2);
                resolve({ code: row.code, timestamp: issued_at });
            });
        });
    });
};

export const getQueuesByCounter = (cId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT t.tId, t.code, t.issued_at, t.sId, s.name AS serviceName, s.service_time AS serviceTime
      FROM tickets t
      JOIN counter_services cs ON cs.sId = t.sId
      JOIN services s ON s.sId = t.sId
      WHERE cs.cId = ?
        AND t.status = 'waiting'
        AND date(t.issued_at, 'localtime') = date('now', 'localtime')
      ORDER BY t.sId, t.issued_at ASC, t.tId ASC`;

    db.all(sql, [cId], (err, rows) => {
      if (err) return reject(err);

      //rows are already sorted by sId so a Map keeps one group per service
      const queues = new Map();
      for (const r of rows) {
        if (!queues.has(r.sId)) {
          queues.set(r.sId, new Queue(r.sId, r.serviceName, r.serviceTime));
        }
        queues.get(r.sId).tickets.push(new Ticket(r.tId, r.code, r.issued_at));
      }
      resolve([...queues.values()]);
    });
  });
};

export const updateTicket = (ticketId, counterId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE tickets
            SET status = 'processing', cId = ?
            WHERE tId = ? AND status = 'waiting'
        `;

        db.run(sql, [counterId, ticketId], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes === 1);
            }
        });
    });
};