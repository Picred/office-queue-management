import sqlite from "sqlite3";
import crypto from "crypto";

const db = new sqlite.Database(process.env.DB_PATH ?? "db.sqlite", (err) => {
    if (err) throw err;
})


// Resolves with the user if username and password are correct, false otherwise
export const getUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT *
        FROM users
        WHERE username = ?
        `

        db.get(sql, [username], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(false);

            const user = { id: row.uId, username: row.username, role: row.role, cId: row.cId };

            crypto.scrypt(password, row.salt, 32, (err, hashedPassword) => {
                if (err) return reject(err);

                if (!crypto.timingSafeEqual(Buffer.from(row.password_hash, "hex"), hashedPassword))
                    return resolve(false);

                resolve(user);
            });
        })
    })
}
