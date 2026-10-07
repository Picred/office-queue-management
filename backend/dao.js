import sqlite from "sqlite3";
import { Service } from "./models.js";
import dayjs from "dayjs";

const db = new sqlite.Database("db.sqlite", (err) => {
    if (err) throw err;
})


export const getAllServices = () => {
    return new Promise((resolve,reject) => {
        const sql = `
        SELECT *
        FROM services
        `

        db.all(sql, [], (err,rows) => {
            if(err) reject(err);

            const serviceList = rows.map((r)=> new Service(r.sId, r.name, r.tag, r.service_time))
            resolve(serviceList)
        })
    })
}


export const newTicket = (sId, tag) => {
    return new Promise((resolve, reject) => {
        const status = "waiting";
        const issued_at = dayjs().toISOString();
        const sql = `
            INSERT INTO tickets (code, sId, issued_at, status, served_at, cId)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Use a regular function instead of an arrow function 
        // so 'this' can access lastID
        db.run(sql, [tag, sId, issued_at, status, null, null], function(err) {
            if (err) return reject(err);
            
            const ticket_info = {
                code: this.lastID,        // Get the auto-incremented ID here
                timestamp: issued_at
            };
            
            resolve(ticket_info);
        });
    });
};