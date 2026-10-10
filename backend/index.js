import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import { getUser } from "./dao-users.js";
import { WebSocketServer } from 'ws';
import { getAllServices, newTicket } from './dao.js';

const app = express();
const port = 3001;

app.use(morgan("dev"));
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
    credentials: true
}));


// Authentication: every counter is an account (username + password)
passport.use(new LocalStrategy(async function verify(username, password, callback) {
    try {
        const user = await getUser(username, password);
        if (!user)
            return callback(null, false, { message: "Incorrect username or password." });

        return callback(null, user);
    } catch (err) {
        return callback(err);
    }
}));

passport.serializeUser(function (user, callback) {
    callback(null, user);
});

passport.deserializeUser(function (user, callback) {
    return callback(null, user);
});

app.use(session({
    secret: "office queue management secret",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.authenticate("session"));

// Middleware for the routes that need a logged in user (e.g. GET /api/tickets/next/:counterid)
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated())
        return next();

    return res.status(401).json({ error: "Not authorized" });
}


/* SESSION APIs */

// POST /api/sessions
app.post("/api/sessions", function (req, res, next) {
    passport.authenticate("local", (err, user, info) => {
        if (err)
            return next(err);
        if (!user)
            return res.status(401).json({ error: info.message });

        req.login(user, (err) => {
            if (err)
                return next(err);

            return res.status(201).json(req.user);
        });
    })(req, res, next);
});

// GET /api/sessions/current
app.get("/api/sessions/current", (req, res) => {
    if (req.isAuthenticated())
        return res.json(req.user);

    return res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/sessions/current
app.delete("/api/sessions/current", (req, res, next) => {
    req.logout((err) => {
        if (err)
            return next(err);

        return res.end();
    });
});


// The tests use the app directly, without opening the port
if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}


/* WEBSOCKET (get ticket) */
// Run websocket on port 3000
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', function connection(ws) {
    console.log("Un client si è appena connesso!");



    // Send a message when it connects
    ws.send(JSON.stringify({
        type: "benvenuto",
        text: "Benvenuto nel server WebSocket locale!"
    }));


    // wait for messages
    ws.on('message', async function incoming(message) {
        // Convert the received buffer into a clean text string
        const messageStr = message.toString();
        console.log('Message received from client:', messageStr);

        let request;
        try {
            // Parse the message string into a JSON object
            request = JSON.parse(messageStr);
        } catch (error) {
            // Handle cases where the message is not a valid JSON
            console.log("The received message is not a valid JSON.");
        }


        if (request.action === "get_services" || request === "get_services") {
            try {

                const services = await getAllServices();


                ws.send(JSON.stringify({
                    type: "services_list",
                    data: services
                }));

            } catch (dbError) {
                console.error("Error while fetching services from the database:", dbError);

                ws.send(JSON.stringify({
                    type: "error",
                    message: "Failed to retrieve services."
                }));
            }
        }

        else if (request.action === "new_ticket" || request === "new_ticket") {
            try {
                const service_id = request.sId
                const tag = request.tag

                const services = await getAllServices();

                let correct = false

                services.forEach(s => {
                    if(s.sId === service_id && s.tag == tag){
                        correct = true
                    }
                });

                
                if(!correct){
                    console.error("Service ID and tag don't match")

                    ws.send(JSON.stringify({
                    type: "error",
                    message: "Service ID and tag don't match."

                }));
                }
                else{

                const ticket_info = await newTicket(service_id, tag)


                ws.send(JSON.stringify({
                    type: "new_ticket",
                    data: ticket_info
                }))
            }

            }
            catch (dbError) {
                console.error("Error while fetching services from the database:", dbError);

                ws.send(JSON.stringify({
                    type: "error",
                    message: "Failed to create ticket."
                }));
            }
        }

        else {
            ws.send(JSON.stringify({
                type: "error",
                message: "Unknown service."
            }));
        }



    });


    ws.on('close', function () {
        console.log("Il client si è disconnesso.");
    });
});

console.log('Server WebSocket in ascolto su ws://localhost:3000');

export { app };
