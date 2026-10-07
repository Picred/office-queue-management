import sqlite from "sqlite3";
import { Service } from "./models.js";
import dayjs from "dayjs";

const db = new sqlite.Database("db.sqlite", (err) => {
    if (err) throw err;
})

db.run("PRAGMA foreign_keys = ON;", (err) => {
    if (err) {
        console.error("Errore nell'attivare le foreign keys:", err);
    } else {
        console.log("Foreign keys attivate con successo!");
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