//i'll stick to commonjs for now...

const express = require("express");
const expressWs = require("express-ws");
const app = express();
expressWs(app);

const local_problemset_js = require("./problemset.js");
const {
  loadQuestionsList,
  loadKeywordsList,
  questionsList,
  keywordsList
} = local_problemset_js;

const MAX_PLAYER = 4;
const port = 3000;
const clientList = new Map();

const serverRoomId = "7761AA"

let currentPlayerCount = 0

async function boardcastClientWaitingForSignal() {
    setInterval(() => {
        for (let client of clientList) {
            if (client[0].readyState === WebSocket.OPEN) {
                client[0].send("Waiting for event...");
            }
        }
    }, 3000);
}

//Boardcast a JSON object to all active clients
async function boardcastClient(object) {
    for (let client of clientList) {
        if (client[0].readyState === WebSocket.OPEN) {
            client[0].send(JSON.stringify(object));
        }
    }
}

app.ws("/", (ws, req) => {
    let clientRemoveAddress = req.socket.remoteAddress
    console.log(`A client has connected from address ${clientRemoveAddress}`);

    ws.on("close", () => {
        if(clientList.has(ws)) {
            console.log(`Player ${clientList.get(ws)} disconnected`);
            clientList.delete(ws);
            currentPlayerCount--;
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
            if(currentPlayerCount <= MAX_PLAYER) {
                clientList.set(ws, clientName)
                console.log(`Player ${clientName} authorized`);
                ws.send("Authorized!");
                currentPlayerCount++;
            } else {
                console.log(`Player ${clientName} refused. Room is full!`);
                ws.send("Room is full!")
            }
        } else {
            console.log(`Player ${clientName} unauthorized`);
            ws.send("Invalid room id. Unauthorized")
        }
    });
});

app.listen(port, () => {
    console.log(`WebSocket server listening on port ${port}`);
});

const clientResponseList = [];

async function initGame() {
    loadKeywordsList("assets/keywords.json")
    loadQuestionsList("assets/questions.json")
    //Reserve for response array
    clientResponseList.length = 0
    for(let i=0; i < MAX_PLAYER; i++) {
        clientResponseList[i] = '';
    }
    //Empty players
    currentPlayerCount = 0;
    clientList.length = 0;
}

async function sendQuestion() {
    const randomIndex = Math.floor(Math.random() * keywordsList.length);
    const question_selected = questionsList[randomIndex];
    questionsList.splice(randomIndex, 1);
    boardcastClient(question_selected)
}

async function sendKeyword() {
    const randomIndex = Math.floor(Math.random() * keywordsList.length);
    const keyword_selected = keywordsList[randomIndex];
    keywordsList.splice(randomIndex, 1);
    boardcastClient(keyword_selected)
}

async function startGame() {
    if(currentPlayerCount == MAX_PLAYER) {

    }
}

//placeholder
boardcastClientWaitingForSignal();