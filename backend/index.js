import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import { getUser } from "./dao-users.js";

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


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
