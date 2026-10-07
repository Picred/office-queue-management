import { WebSocketServer } from 'ws';
import { getAllServices, newTicket } from './dao.js';

// Run websocket on port 3000
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', function connection(ws) {
    console.log("Un client si è appena connesso!");



    // Send a message when it connects
    ws.send(JSON.stringify({
        type: "benvenuto",
        text: "Welcome to the local WebSocket!"
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
            ws.send(JSON.stringify({
                type: "error",
                message: "Invalid JSON format."
            }));
            return;
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