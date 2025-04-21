//fuck commonjs

import express from "express";
import expressWs from "express-ws";
const app = express();
expressWs(app);

import {
    questionsList, keywordsList,
    loadQuestionsList, loadKeywordsList
} from "./problemset.js";

const MAX_PLAYER = 4;
const port = 3000;
const clientList = new Map();               //store websocket object & name
const clientWorkingStateList = new Map();   //store boolean client is answering
const clientAnswerList = new Map();         //consists of answer & client answer time 
const clientScoreList = new Map();         //store client's answer
const clientMessageListenerList = new Map();
const clientTimeoutList = new Map();
const ANSWER_TIMEOUT = 30000 

let serverRoomId

let currentPlayerCount = 0

function getRandomRoomId(len) {
    const charlist = 'ABCDEF0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
        result += charlist.charAt(Math.floor(Math.random() * charlist.length));
    }
    return result;
}

function getRandomIndex(arr) {
    if (!arr || arr.length === 0) {
        return undefined; // Handle empty or non-array input
    }
    const randomIndex = Math.floor(Math.random() * arr.length);
    return randomIndex;
}

function randomShuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

async function boardcastClientWaitingForSignal() {
    return setInterval(() => {
        for (let client of clientList) {
            if (client[0].readyState === WebSocket.OPEN) {
                client[0].send("Waiting for event...");
            }
        }
    }, 3000);
}

//Boardcast a JSON object to all active clients
async function boardcastClient(object) {
    //object is always json object already
    for (let client of clientList) {
        if (client[0].readyState === WebSocket.OPEN) {
            client[0].send(JSON.stringify(object));
        }
    }
}

async function broadcastQuestion(questionObject) {
    //Every resolve call mark each client completion
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if (wsObject.readyState !== WebSocket.OPEN) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            wsObject.send(JSON.stringify(questionObject));
            clientAnswerList.set(wsObject, null);
            clientWorkingStateList.set(wsObject, true);
            console.log(`Question sent to player ${playerName}`)

            // const innerMessageListener = (playerAnswer) => {
            //     clientAnswerList.set(wsObject, JSON.parse(playerAnswer));
            //     console.log(`Player ${clientList.get(wsObject)} answered: ${playerAnswer}`);
            //     wsObject.off('message', innerMessageListener);
            //     clientMessageListenerList.set(wsObject, null);
            //     clientWorkingStateList.set(wsObject, false);
            // };

            // wsObject.once('message', innerMessageListener);
            // clientMessageListenerList.set(wsObject, innerMessageListener);
            // clientTimeoutList.set(wsObject, setTimeout(() => {
            //     clientTimeoutList.set(wsObject, null);
            //     clientAnswerList.set(wsObject, { answer: "", time: 0 });
            //     console.log(`Player ${clientList.get(wsObject)} timeouted:`);
            // }, 20000));

            const timeoutId = setTimeout(() => {
                console.log(`No response from client ${playerName}`);
                clientWorkingStateList.set(wsObject, false);
                resolve()
            }, ANSWER_TIMEOUT);

            wsObject.once('message', clientAnswer => {
                clearTimeout(timeoutId);
                clientWorkingStateList.set(wsObject, false);
                try {
                    const clientAnswerJson = JSON.parse(clientAnswer.toString());
                    clientAnswerList.set(wsObject, clientAnswerJson);
                    console.log(`Answer from client ${playerName}: ${clientAnswerJson["answer"]}`);
                } catch(error) {
                    console.error(`Error parsing answer from client ${playerName}: `, error);
                }
                resolve();
            });
        })
    })

    // Await *all* the client‑promises before returning
    await Promise.all(sendPromises);
}

app.ws("/", (ws, req) => {
    let clientRemoveAddress = req.socket.remoteAddress
    console.log(`A client has connected from address ${clientRemoveAddress}. Waiting for identification`);

    ws.on("close", () => {
        if (clientList.has(ws)) {
            console.log(`Player ${clientList.get(ws)} disconnected`);
            clientList.delete(ws);
            clientWorkingStateList.delete(ws);
            clientAnswerList.delete(ws);
            clientScoreList.delete(ws);
            clientMessageListenerList.delete(ws);
            clientTimeoutList.delete(ws);
            currentPlayerCount--;
        }
    });

    ws.on("error", (err) => {
        console.error("WebSocket error:", err);
    });

    ws.once('message', (msg) => {
        let jsonData
        try {
            jsonData = JSON.parse(msg);
        } catch (error) {
            console.error("Error parsing JSON:", error.message);
            return
        }

        let clientName = jsonData["name"]
        let roomId = jsonData["id"]

        console.log(`Client name: ${clientName}\nClient ID: ${roomId}`);

        if (roomId == serverRoomId) {
            if (currentPlayerCount <= MAX_PLAYER) {
                clientList.set(ws, clientName)
                clientWorkingStateList.set(ws, false);
                clientAnswerList.set(ws, undefined);
                clientScoreList.set(ws, 0);
                console.log(`Player ${clientName} authorized`);
                ws.send("Authorized!");
                currentPlayerCount++;
            } else {
                console.log(`Player ${clientName} refused. Room is full!`);
                ws.send("Room is full!")
                ws.close();
            }
        } else {
            console.log(`Player ${clientName} unauthorized`);
            ws.send("Invalid room id. Unauthorized")
            ws.close();
        }
    });
});

app.listen(port, () => {
    serverRoomId = getRandomRoomId(6);
    console.log(`WebSocket server listening on port ${port}`);
    console.log(`Conenct with room ID ${serverRoomId}`);
});

const clientResponseList = [];

async function initGame() {
    // await loadKeywordsList(process.cwd() + "/server/assets/keywords.json")
    // await loadQuestionsList(process.cwd() + "/server/assets/questions.json")
    await loadKeywordsList(process.cwd() + "/assets/keywords.json")
    await loadQuestionsList(process.cwd() + "/assets/questions.json")
    //Reserve for response array
    clientResponseList.length = 0
    for (let i = 0; i < MAX_PLAYER; i++) {
        clientResponseList[i] = '';
    }
    //Empty players
    currentPlayerCount = 0;
    clientList.length = 0;
    //Shuffle keywords clues
    for (const ele of keywordsList) {
        let innerCluesList = ele["clues"];      //assignment on array = reference, use = [...oldarr] to shallow copy
        randomShuffleArray(innerCluesList)
    }
}

async function sendQuestion() {
    const randomIndex = Math.floor(Math.random() * keywordsList.length);
    const question_selected = questionsList[randomIndex];
    questionsList.splice(randomIndex, 1);
    await boardcastClient(question_selected)
}

async function sendKeyword() {
    const randomIndex = Math.floor(Math.random() * keywordsList.length);
    const keyword_selected = keywordsList[randomIndex];
    keywordsList.splice(randomIndex, 1);
    await boardcastClient(keyword_selected)
}

async function choosePiece(params) {

}

async function ingame() {
    for (let i = 0; i < 12; i++) {
        let givenIndex = getRandomIndex(questionsList);
        let questionObject = { ...questionsList[givenIndex] };
        questionsList.splice(givenIndex, 1);
        questionObject.answer_index = undefined;
        randomShuffleArray(questionObject.choice);
        await broadcastQuestion(questionObject);
        //for-loop is still synchronous, need to hold back
        //In practice there would be a button to choose question from UI, this is for testing
        const delayBetweenQuestion = 3000;
        console.log(`Cooldown between question: ${delayBetweenQuestion}ms`)
        await new Promise(dummy => setTimeout(dummy, delayBetweenQuestion));
    }
}

async function startGame() {
    // if(currentPlayerCount == MAX_PLAYER) {

    // } else console.log("Not enough players to start!");

    
    let intervalHandle = setInterval(() => {
        for (let client of clientList) {
            if (client[0].readyState === WebSocket.OPEN) {
                client[0].send("Waiting for event...");
            }
        }
        if (currentPlayerCount > 0) {
            clearInterval(intervalHandle);
            console.log("Starting game...")
            for (let client of clientList) {
                if (client[0].readyState === WebSocket.OPEN) {
                    client[0].send("Starting game...!");
                }
            }
            ingame();       //setInterval is async, need to make function call to execute synchorously
        }
    }, 3000)


}

async function main() {
    await initGame();
    await startGame();
}

main();
//placeholder
// let intervalHandle = boardcastClientWaitingForSignal();
