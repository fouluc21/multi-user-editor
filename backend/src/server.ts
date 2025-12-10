import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import {Message, UserMessage} from "./types/message";
import app from "./app";

const PORT = 9995

let documentText = "";

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});

let nextClientId = 1;
const clients = new Map<string, WebSocket>();

wss.on("connection", (websocket) => {
    const clientId = `Client-${nextClientId++}`;
    clients.set(clientId, websocket);

    console.log("Client connected: " + clientId);

    const userJoinMessage: UserMessage = {
        type: "user-join",
        clients: Array.from(clients.keys()),
    }
    broadcastAll(JSON.stringify(userJoinMessage));

    websocket.send(JSON.stringify({
        type: "document",
        text: documentText
    }));

    websocket.on("message", (data) => {
       let message: Message;

       try {
           message = JSON.parse(data.toString());
       } catch (e) {
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

       const userLeaveMessage: UserMessage = {
           type: "user-left",
           clients: Array.from(clients.keys())
       }

       broadcastOthers(JSON.stringify(userLeaveMessage), websocket);
    });
})

function broadcastAll(payload: string) {
    for (const client of clients.values()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
}

function broadcastOthers(payload: string, sender: WebSocket) {
    for (const client of clients.values()) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
}