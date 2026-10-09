const SERVER_URL = "ws://localhost:3000";

const socket = new WebSocket(SERVER_URL);

const socketReady = new Promise((resolve, reject) => {
    socket.addEventListener("open", () => {
        resolve();
    });

    socket.addEventListener("error", () => {
        reject(new Error("WebSocket connection failed"));
    });
});


async function getServices() {
    await socketReady;

    return new Promise((resolve, reject) => {

        const handleMessage = (event) => {
            const response = JSON.parse(event.data);

            if (response.type === "services_list") {
                socket.removeEventListener("message", handleMessage);
                resolve(response.data);
            }

            if (response.type === "error") {
                socket.removeEventListener("message", handleMessage);
                reject(new Error(response.message));
            }
        };

        socket.addEventListener("message", handleMessage);

        socket.send(JSON.stringify({
            action: "get_services"
        }));
    });
}


async function createTicket(sId, tag) {
    await socketReady;

    return new Promise((resolve, reject) => {

        const handleMessage = (event) => {
            const response = JSON.parse(event.data);

            if (response.type === "new_ticket") {
                socket.removeEventListener("message", handleMessage);
                resolve(response.data);
            }

            if (response.type === "error") {
                socket.removeEventListener("message", handleMessage);
                reject(new Error(response.message));
            }
        };

        socket.addEventListener("message", handleMessage);

        socket.send(JSON.stringify({
            action: "new_ticket",
            sId: sId,
            tag: tag
        }));
    });
}


// Authentication: REST APIs of the Express server (the session cookie travels with credentials: "include")
const API_URL = "http://localhost:3001/api";

async function login(credentials) {
    const response = await fetch(`${API_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials)
    });

    const body = await response.json();

    if (!response.ok) {
        throw new Error(body.error);
    }

    return body;
}


// Resolves with the logged in user, or null if nobody is logged in
async function getUserInfo() {
    const response = await fetch(`${API_URL}/sessions/current`, {
        credentials: "include"
    });

    if (response.status === 401) {
        return null;
    }

    return response.json();
}


async function logout() {
    await fetch(`${API_URL}/sessions/current`, {
        method: "DELETE",
        credentials: "include"
    });
}


export { getServices, createTicket, login, getUserInfo, logout };