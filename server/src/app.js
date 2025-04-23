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
let resultArr = [];   //update each play turn, json array contain wsobj, answer, epoch, point
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

function updateClientScore(wsObj, scoreAdded) {
    if(clientScoreList.has(wsObj)) {
        let currentClientScore = clientScoreList.get(wsObj);
        currentClientScore += scoreAdded;
        clientScoreList.set(wsObj, currentClientScore);
    } else {
        console.error(`updateClientScore(): No such object`);
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

function checkClientTimepoint(clientTimepoint, serverTimepoint) {
    if(Number.isInteger(clientTimepoint)) {
        const diff = clientTimepoint - serverTimepoint;
        if(0 < diff && diff < ANSWER_TIMEOUT*1000) return true;
    }
    return false;
}

async function broadcastQuestion(questionObject, serverTimepoint) {
    //Every resolve call mark each client completion
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if (wsObject.readyState !== WebSocket.OPEN) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            wsObject.send(JSON.stringify(questionObject));
            clientAnswerList.set(wsObject, undefined);
            console.log(`Question sent to player ${playerName}`)

            const timeoutId = setTimeout(() => {
                console.log(`No response from client ${playerName}`);
                const clientAnswerJson = {"answer": "", "time": serverTimepoint};
                clientAnswerList.set(wsObject, clientAnswerJson);
                resolve()
            }, ANSWER_TIMEOUT);

            //Client shall sent its answer timepoint. If none or invalid provided, server timepoint is used
            const answerListener = (clientAnswer) => {
                try {
                    let capturedTimepoint = Date.now();
                    const clientAnswerJson = JSON.parse(clientAnswer.toString());
                    if(clientAnswerJson["answer"] !== undefined) {
                        clearTimeout(timeoutId);
                        console.log(`Client ${playerName} sent answer`);
                        wsObject.off("message", answerListener);
                        //Check client timepoint
                        if(!checkClientTimepoint(clientAnswerJson["time"], serverTimepoint)) {
                            clientAnswerJson["time"] = capturedTimepoint;
                        }
                        clientAnswerList.set(wsObject, clientAnswerJson);
                        resolve();
                    }
                } catch(error) {
                    console.error(`Error parsing answer from client ${playerName}: `, error);
                }
            }

            wsObject.on("message", answerListener);

        })
    })

    // Await *all* the client‑promises before returning
    await Promise.all(sendPromises);
}

async function broadcastAnswer(originalQuestionObject, serverTimepoint) {
    resultArr = [];
    //Notify user first, then build result array later
    const correctAnswer = originalQuestionObject["choice"][originalQuestionObject["answer_index"]];
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        //Client shall sent its answer timepoint. If none provided, server timepoint is used
        const playerAnswerObj = clientAnswerList.get(wsObject);
        const playerAnswer = playerAnswerObj["answer"];
        const playerTimepoint = playerAnswerObj["time"];
        if(playerAnswer === correctAnswer) {
            // console.log(`Client ${playerName} give correct answer: ${playerAnswer}`);
            wsObject.send(`Correct answer!`);
        } else {
            // console.log(`Client ${playerName} give incorrect answer: ${playerAnswer}`);
            wsObject.send(`Wrong answer. Correct answer is ${correctAnswer}`);
        }
        resultArr.push({"wsobj": wsObject, "answer": playerAnswer, "epoch": playerTimepoint - serverTimepoint, "point": 0});
        return Promise.resolve();
    });
    
    await Promise.all(sendPromises);

    resultArr.sort((a, b) => {
        const timea = a["epoch"];
        const timeb = b["epoch"];
        return timea - timeb;
    });

    let tpoint = 40;
    for(let ele of resultArr) {
        if(ele["answer"] === correctAnswer) {
            ele["point"] = tpoint;
            updateClientScore(ele["wsobj"], tpoint);
            tpoint -= 10;
        }
    }
}

async function broadcastResultBoard() {
    let tstr = "";
    tstr += toString()
}

async function broadcastLeaderboard() {
    let leaderboardString = "Leaderboard:\n";
    Array.from(clientScoreList).map(([wsObject, score]) => {
        leaderboardString += `${clientList.get(wsObject)}: ${score}\n`;
    })
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        wsObject.send(leaderboardString);
        Promise.resolve();
    });

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

async function prepareClientQuestion(originalQuestionObject) {
    let newObject = JSON.parse(JSON.stringify(originalQuestionObject));
    newObject["answer_index"] = undefined;
    randomShuffleArray(newObject["choice"]);
    return newObject;
} 

async function ingame() {
    for (let i = 0; i < 12; i++) {
        let givenIndex = getRandomIndex(questionsList);
        let originalQuestionObject = { ...questionsList[givenIndex] };  ////still a json object
        questionsList.splice(givenIndex, 1);

        let questionObject = await prepareClientQuestion(originalQuestionObject);

        let serverTimepoint = Date.now();
        await broadcastQuestion(questionObject, serverTimepoint);
        await broadcastAnswer(originalQuestionObject, serverTimepoint);
        await broadcastResultBoard()
        await broadcastLeaderboard();
        //for-loop is still synchronous, need to hold back
        //In practice there would be a button to choose question from UI, this is for testing
        const delayBetweenQuestion = 3000;
        console.log(`Cooldown between question: ${delayBetweenQuestion}ms`)
        await new Promise(dummy => setTimeout(dummy, delayBetweenQuestion));
    }
}

function getConnectedPlayerName() {
    return Array.from(clientList);
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
        if (currentPlayerCount > 2) {
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
