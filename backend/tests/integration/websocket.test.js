import { describe, it, expect, afterAll } from 'vitest';
import { WebSocket } from 'ws';


import '../../index.js'; 

describe('WebSocket Integration Tests', () => {
    let activeClient;

    afterAll(() => {
        if (activeClient && activeClient.readyState === WebSocket.OPEN) {
            activeClient.close();
        }
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

});