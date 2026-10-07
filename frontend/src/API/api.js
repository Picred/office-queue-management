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


export { getServices, createTicket };