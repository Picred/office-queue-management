import { describe, it, expect, afterAll } from 'vitest';
import { WebSocket } from 'ws';


import '../../index.js'; 

describe('WebSocket Integration Tests', () => {
    let activeClient;

    afterAll(async () => {
        if (activeClient && activeClient.readyState === WebSocket.OPEN) {
            activeClient.close();
        }
        // Wait a bit for any pending server console logs to finish before tearing down
        await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('Connection start test', async () => {
        return new Promise((resolve, reject) => {
            activeClient = new WebSocket('ws://localhost:3000');

            activeClient.on('message', (data) => {
                const message = JSON.parse(data.toString());
                
                // Il server invia un messaggio di benvenuto appena ci si connette
                if (message.type === 'benvenuto') {
                    expect(message.text).toBe("Welcome to the local WebSocket!");
                    resolve();
                }
            });

            activeClient.on('error', (err) => {
                reject(err);
            });
        });
    });

    it('Get service list test', async () => {
        return new Promise((resolve, reject) => {
            const client = new WebSocket('ws://localhost:3000');

            client.on('open', () => {
                // Service request
                client.send(JSON.stringify({ action: "get_services" }));
            });

            client.on('message', (data) => {
                const response = JSON.parse(data.toString());

                // wait for service response
                if (response.type === 'services_list') {
                    expect(response).toHaveProperty('data');
                    expect(Array.isArray(response.data)).toBe(true);
                    
                    client.close();
                    resolve();
                }
            });

            client.on('error', (err) => {
                client.close();
                reject(err);
            });
        });
    });

    it('Create new ticket test', async () => {
        return new Promise((resolve, reject) => {
            const client = new WebSocket('ws://localhost:3000');

            client.on('open', () => {
                // Ticket request for Shipping service (sId: 1, tag: 'S')
                client.send(JSON.stringify({ 
                    action: "new_ticket",
                    sId: 1,
                    tag: "S"
                }));
            });

            client.on('message', (data) => {
                const response = JSON.parse(data.toString());

                if (response.type === 'error') {
                    client.close();
                    reject(new Error(response.message));
                }

                // wait for new_ticket response
                if (response.type === 'new_ticket') {
                    try {
                        // Check if the response contains data
                        expect(response).toHaveProperty('data');
                        // Check if the data contains a timestamp and code
                        expect(response.data).toHaveProperty('timestamp');
                        expect(response.data).toHaveProperty('code');
                        
                        client.close();
                        resolve();
                    } catch (error) {
                        client.close();
                        reject(error);
                    }
                }
            });

            client.on('error', (err) => {
                client.close();
                reject(err);
            });
        });
    });

});