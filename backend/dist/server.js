"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const app_1 = __importDefault(require("./app"));
const PORT = 9995;
let documentText = "";
const server = http_1.default.createServer(app_1.default);
const wss = new ws_1.WebSocketServer({ server });
server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
let nextClientId = 1;
const clients = new Map();
wss.on("connection", (websocket) => {
    const clientId = `Client-${nextClientId++}`;
    clients.set(clientId, websocket);
    console.log("Client connected: " + clientId);
    const userJoinMessage = {
        type: "user-join",
        clients: Array.from(clients.keys()),
    };
    broadcastAll(JSON.stringify(userJoinMessage));
    websocket.send(JSON.stringify({
        type: "document",
        text: documentText
    }));
    websocket.on("message", (data) => {
        let message;
        try {
            message = JSON.parse(data.toString());
        }
        catch (e) {
            console.error("Ungültiges JSON: " + e);
            return;
        }
        if (message.type == "update") {
            documentText = message.text;
            const payload = JSON.stringify({
                type: "update",
                text: documentText
            });
            broadcastAll(payload);
        }
    });
    websocket.on("close", () => {
        console.log("Client disconnected: " + clientId);
        clients.delete(clientId);
        const userLeaveMessage = {
            type: "user-left",
            clients: Array.from(clients.keys())
        };
        broadcastOthers(JSON.stringify(userLeaveMessage), websocket);
    });
});
function broadcastAll(payload) {
    for (const client of clients.values()) {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(payload);
        }
    }
}
function broadcastOthers(payload, sender) {
    for (const client of clients.values()) {
        if (client !== sender && client.readyState === ws_1.WebSocket.OPEN) {
            client.send(payload);
        }
    }
}
