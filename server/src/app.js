const express = require("express");
const expressWs = require("express-ws");
const app = express();
expressWs(app);

const port = 3000;
const clientList = new Map();

const serverRoomId = "7761AA"

// Clean broadcast every second
setInterval(() => {
    for (let client of clientList) {
        if (client[0].readyState === 1) {
            client[0].send("Waiting for event...");
        }
    }
}, 5000);

app.ws("/", (ws, req) => {
    let clientRemoveAddress = req.socket.remoteAddress
    console.log(`A client has connected from address ${clientRemoveAddress}`);

    ws.on("close", () => {
        if(clientList.has(ws)) {
            console.log(`Player ${clientList.get(ws)} disconnected`);
            clientList.delete(ws);
        }
    });

    ws.on("error", (err) => {
        console.error("WebSocket error:", err);
    });

    ws.on('message', (msg) => {
        let jsonData
        try {
            jsonData = JSON.parse(msg);
        } catch(error) {
            console.error("Error parsing JSON:", error.message);
            return
        }

        clientName = jsonData["name"]
        roomId = jsonData["id"]

        console.log(`Client name: ${clientName}\nClient ID: ${roomId}`);

        if(roomId == serverRoomId) {
            clientList.set(ws, clientName)
            console.log(`Player ${clientName} authorized`);
            ws.send("Authorized!");
        } else {
            console.log(`Player ${clientName} unauthorized`);
            ws.send("Invalid room id. Unauthorized")
        }
    });
});

app.listen(port, () => {
    console.log(`WebSocket server listening on port ${port}`);
});