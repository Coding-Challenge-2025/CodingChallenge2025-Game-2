//fuck commonjs

import express from "express";
import expressWs from "express-ws";
const app = express();
expressWs(app);

import {
    questionsList, keywordsList,
    loadQuestionsList, loadKeywordsList
} from "./problemset.js";

import {
    getRandomRoomId, getRandomIndex,
    randomShuffleArray, checkClientTimepoint, imageFileToBase64,
    waitForAnyKey, getLocalTimeISO8601, logging, startLogging
} from "./utilities.js";

const MAX_PLAYER = 4;
const port = 3000;

//Format: [wsobj, string]
const clientList = new Map();               

//Format: [string, wsobj]
const clientNameList = new Map();         

//Store boolean value determine if client 
//is still able to participate in the game
//Format: [wsobj, boolean]
const clientActiveStateList = new Map();

//Store client answer & answer time
//Format: [wsobj, object:{answer, time}]
const clientAnswerList = new Map();

//Leaderboard, in map
//Format: [wsobj, integer]
const clientScoreList = new Map();

//Store client name and keyword for recording
//Format: [string, string] 
const keywordAnswerRecord = new Map();

let resultArr = [];   //update each play turn, json array contain wsobj, answer, epoch, point
let permitKeywordAnswer = false;
const keywordAnswerQueue = [];
const ANSWER_TIMEOUT = 30000 
const KEYWORD_CORRECT_POINT = 80

let serverRoomId
let currentPlayerCount = 0

let loggingFilename;

function releaseClient(ws) {
    let playerName = getPlayerNameFromHandle(ws);
    clientList.delete(ws);
    clientActiveStateList.delete(ws);
    clientAnswerList.delete(ws);
    clientScoreList.delete(ws);
    clientNameList.delete(playerName);
    if(keywordAnswerRecord.has(playerName)) keywordAnswerRecord.delete(playerName);
    currentPlayerCount--;
}

function allocateClient(ws, clientName, initialScore = 0) {
    clientList.set(ws, clientName)
    clientActiveStateList.set(ws, true);
    clientAnswerList.set(ws, undefined);
    clientScoreList.set(ws, 0);
    clientNameList.set(clientName, ws);
    currentPlayerCount++;
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

function getPlayerNameFromHandle(wsObject) {
    return clientList.get(wsObject);
}

function getHandleFromPlayerName(playerName) {
    return clientNameList.get(playerName);
}

function isPlayerActive(wsObject) {
    return clientActiveStateList.get(wsObject) === true ? true : false;
}

function getLeaderboard() {
    let jsonLeaderboard = [];
    Array.from(clientScoreList).map(([wsObject, score]) => {
        jsonLeaderboard.push({"name": getPlayerNameFromHandle(wsObject), "score": score});
    })
    return jsonLeaderboard;
}

const STATUS_CONNECTION_ACCEPT = "ACCEPT";
const STATUS_CONNECTION_DENIED = "DENIED";
const STATUS_CONNECTION_NOTIFY = "NOTIFY";
const STATUS_CONNECTION_GAMESTART = "GS";
const STATUS_CONNECTION_GAMEEND = "GE";
const STATUS_CONNECTION_PLAYERELOSE = "LOSE";
const STATUS_CONNECTION_PLAYERWIN = "WIN";

async function sendStatus(wsObject, statusCode, statusMessage = undefined) {
    if(wsObject.readyState == WebSocket.OPEN) {
        await wsObject.send(JSON.stringify({"status": statusCode, "message": statusMessage}));
    }
}

async function sendConnectionAccepted(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_ACCEPT);
}

async function sendConnectionRoomIsFull(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_DENIED, "Room is full");
}

async function sendConnectionInvalidID(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_DENIED, "Invalid room ID");
}

async function sendConnectionDuplicateName(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_DENIED, "Name already existed");
}

async function sendConnectionWaitingForEvent(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_NOTIFY, "Waiting for event...");
}

async function sendConnectionGameStart(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_GAMESTART, "Starting game...");
}

//game stop, send leaderboard
async function sendConnectionGameEnd(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_GAMEEND, JSON.stringify(getLeaderboard()));
}

async function sendConnectionPlayerLose(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_PLAYERELOSE);
}

async function sendConnectionPlayerWin(wsObject) {
    await sendStatus(wsObject, STATUS_CONNECTION_PLAYERWIN);
}

async function broadcastKeywordProperties(keywordObject) {
    let base64Image = await imageFileToBase64("assets/"+keywordObject["image_dir"]);

    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        wsObject.send(JSON.stringify({"keyword_length": keywordObject["keyword"].length, "image": base64Image}))
        Promise.resolve();
    });

    await Promise.all(sendPromises);
}

async function broadcastImpl(callback) {
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if (wsObject.readyState !== WebSocket.OPEN || !isPlayerActive(wsObject)) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            callback(resolve, wsObject, playerName);
        });
    });
    await Promise.all(sendPromises);
}

async function broadcastQuestion(questionObject, serverTimepoint, forceWaiting = false) {
    //Every resolve call mark each client completion
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if (wsObject.readyState !== WebSocket.OPEN) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            wsObject.send(JSON.stringify(questionObject));
            clientAnswerList.set(wsObject, undefined);
            logging(loggingFilename, `Question sent to player ${playerName}`)

            if(isPlayerActive(wsObject)) {
                const timeoutId = setTimeout(() => {
                    logging(loggingFilename, `No response from client ${playerName}`);
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
                            logging(loggingFilename, `Client ${playerName} sent answer`);
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
                };
                wsObject.on("message", answerListener);
            } else {
                const clientAnswerJson = {"answer": "", "time": serverTimepoint};
                clientAnswerList.set(wsObject, clientAnswerJson);
                resolve();
            }
        })
    })

    if(forceWaiting) {
        const outerTimeoutHandle = setTimeout(() => {
            clearTimeout(outerTimeoutHandle);
        }, ANSWER_TIMEOUT);
    }

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
        wsObject.send(JSON.stringify({"is_correct": (playerAnswer === correctAnswer ? 1 : 0), "correct_answer": correctAnswer}))
        // if(playerAnswer === correctAnswer) {
        //     logging(loggingFilename, `Client ${playerName} give correct answer: ${playerAnswer}`);
        //     wsObject.send(`Correct answer!`);
        // } else {
        //     logging(loggingFilename, `Client ${playerName} give incorrect answer: ${playerAnswer}`);
        //     wsObject.send(`Wrong answer. Correct answer is ${correctAnswer}`);
        // }
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
    let tbool = false;
    for(let ele of resultArr) {
        if(ele["answer"] === correctAnswer) {
            tbool = true;
            ele["point"] = tpoint;
            updateClientScore(ele["wsobj"], tpoint);
            tpoint -= 10;
        }
    }

    return tbool;
}

async function broadcastClue(keywordObject, doSendClue) {
    let selectedIndex = getRandomIndex(keywordObject["clues"]);
    let clueWord = null;
    if(doSendClue) {
        clueWord = keywordObject["clues"][selectedIndex];
    }
    //discard for nothing in case of all incorrect answer
    keywordObject["clues"].splice(selectedIndex, 1);       
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        wsObject.send(JSON.stringify({"clue": clueWord}));
    })

    await Promise.all(sendPromises);
}

async function broadcastResultBoard() {
    let sendJsonResultArr = [];
    resultArr.map(({wsobj, answer, epoch, point}) => {
        let epochInSecond = epoch/1000;
        logging(loggingFilename, `${epochInSecond.toFixed(3)}s ~ ${getPlayerNameFromHandle(wsobj)}: ${answer} => +${point}`);
        sendJsonResultArr.push({"epoch": epochInSecond, "name": getPlayerNameFromHandle(wsobj), "answer": answer, "point": point});
    })
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        wsObject.send(JSON.stringify(sendJsonResultArr));
        Promise.resolve();
    });

    await Promise.all(sendPromises);
}

async function broadcastLeaderboard() {
    let leaderboardJSONString = JSON.stringify(getLeaderboard()); 
    logging(loggingFilename, leaderboardJSONString);
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        wsObject.send(leaderboardJSONString);
        Promise.resolve();
    });

    await Promise.all(sendPromises);
}

//answer keyword by connecting to this endpoint with josn data: name, keyword
app.ws("/submitkeyword", (ws, req) => {
    ws.once('message', (msg) => {
        if(permitKeywordAnswer) {
            let jsonData
            try {
                jsonData = JSON.parse(msg);
            } catch (error) {
                return
            }

            let clientName = jsonData["name"];
            let clientKeyword = jsonData["keyword"];
            if(getHandleFromPlayerName(clientName) === undefined || 
                !isPlayerActive(getHandleFromPlayerName(clientName)) || 
                    keywordAnswerRecord.get(clientName) != undefined) {
                    return;
            } else {
                logging(loggingFilename, `Player ${clientName} answer keyword`);
                keywordAnswerQueue.push(jsonData);
                keywordAnswerRecord.set(clientName, clientKeyword);
            }
        }
    })
});

async function resolveKeywordAnswer(keywordString) {
    for(let ele of keywordAnswerQueue) {
        let clientName = ele["name"];
        let clientKeyword = ele["keyword"];

        clientActiveStateList.set(getHandleFromPlayerName(clientName), false);
        if(clientKeyword === keywordString) {
            logging(loggingFilename, `Player ${clientName} keyword ${clientKeyword} correct!`);
            updateClientScore(getHandleFromPlayerName(clientName), KEYWORD_CORRECT_POINT);
            sendConnectionPlayerWin(getHandleFromPlayerName(clientName));
            return true;
        } else {
            logging(loggingFilename, `Player ${clientName} keyword ${clientKeyword} incorrect`);
            sendConnectionPlayerLose(getHandleFromPlayerName(clientName));
        }
    }
    keywordAnswerQueue.splice(0);
    return false;
}

app.ws("/", (ws, req) => {
    let clientRemoveAddress = req.socket.remoteAddress
    logging(loggingFilename, `A client has connected from address ${clientRemoveAddress}. Waiting for identification`);

    ws.on("close", () => {
        if (clientList.has(ws)) {
            logging(loggingFilename, `Player ${getPlayerNameFromHandle(ws)} disconnected`);
            releaseClient(ws);
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
        let initialScore = jsonData["score"]

        logging(loggingFilename, `Client name: ${clientName} Client ID: ${roomId}`);

        if(roomId !== serverRoomId) {
            logging(loggingFilename, `Player ${clientName} unauthorized`);
            sendConnectionInvalidID(ws);
            ws.close();
            return;
        }
        if(currentPlayerCount >= MAX_PLAYER) {
            logging(loggingFilename, `Player ${clientName} refused. Room is full!`);
            sendConnectionRoomIsFull(ws);
            ws.close();
            return;
        }
        if(getHandleFromPlayerName(clientName) !== undefined) {
            logging(loggingFilename, `Player ${clientName} refused. Duplicated name`);
            sendConnectionDuplicateName(ws);
            ws.close();
            return;
        }

        allocateClient(ws, clientName, Number.isInteger(initialScore) ? initialScore : 0);
        logging(loggingFilename, `Player ${clientName} authorized`);
        sendConnectionAccepted(ws);
    });
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


async function choosePiece(params) {

}

async function prepareClientQuestion(originalQuestionObject, questionIndex) {
    let newObject = JSON.parse(JSON.stringify(originalQuestionObject));
    newObject["answer_index"] = undefined;
    newObject["question_index"] = questionIndex;
    randomShuffleArray(newObject["choice"]);
    return newObject;
}

//waiting for ui...
async function verifyAnswer() {

}

async function ingame() {
    permitKeywordAnswer = true;
    let selectedKeywordObject = keywordsList[getRandomIndex(keywordsList)];
    logging(loggingFilename, `Selected keyword: ${selectedKeywordObject["keyword"]}`)
    randomShuffleArray(selectedKeywordObject["clues"]);
    await broadcastKeywordProperties(selectedKeywordObject);

    for (let i = 0; i < 12; i++) {
        let givenIndex = getRandomIndex(questionsList);
        let originalQuestionObject = { ...questionsList[givenIndex] };  ////still a json object
        questionsList.splice(givenIndex, 1);

        let questionObject = await prepareClientQuestion(originalQuestionObject, i+1);

        let serverTimepoint = Date.now();
        await broadcastQuestion(questionObject, serverTimepoint);
        let anyCorrectAnswerGiven = await broadcastAnswer(originalQuestionObject, serverTimepoint);
        await waitForAnyKey("Press any key to result");
        await broadcastResultBoard()
        await broadcastClue(selectedKeywordObject, anyCorrectAnswerGiven);

        if(keywordAnswerQueue.length > 0) await waitForAnyKey("Press any key to resolve keyword answer");
        let winnerFound = await resolveKeywordAnswer(selectedKeywordObject["keyword"]);
        if(winnerFound) {
            broadcastImpl((resolve, wsObject) => {
                sendConnectionGameEnd(wsObject)
                resolve();
            });
            permitKeywordAnswer = false
            return;
        }

        await waitForAnyKey("Press any key for leaderboard");
        await broadcastLeaderboard();
        //for-loop is still synchronous, need to hold back
        //In practice there would be a button to choose question from UI, this is for testing
        // const delayBetweenQuestion = 3000;
        // logging(loggingFilename, `Cooldown between question: ${delayBetweenQuestion}ms`)
        // await new Promise(dummy => setTimeout(dummy, delayBetweenQuestion));

        await waitForAnyKey("Press any key to next question");
    }

    //can be a long delay here
    permitKeywordAnswer = false;
    broadcastImpl((resolve, wsObject) => {
        sendConnectionGameEnd(wsObject)
        resolve();
    });
}

function getConnectedPlayerName() {
    return Array.from(clientList);
}

async function startGame() {
    // if(currentPlayerCount == MAX_PLAYER) {

    // } else logging(loggingFilename, "Not enough players to start!");

    
    let intervalHandle = setInterval(() => {
        for (let client of clientList) {
            sendConnectionWaitingForEvent(client[0]);
        }
        if (currentPlayerCount >= 2) {
            clearInterval(intervalHandle);
            logging(loggingFilename, "Starting game...")
            for (let client of clientList) {
                sendConnectionGameStart(client[0]);
            }
            ingame();       //setInterval is async, need to make function call to execute synchorously
        }
    }, 3000)


}

async function main() {
    loggingFilename = await startLogging();
    app.listen(port, () => {
        serverRoomId = getRandomRoomId(4);
        logging(loggingFilename, `WebSocket server listening on port ${port}`);
        logging(loggingFilename, `Conenct with room ID ${serverRoomId}`);
    });
    await initGame();
    await startGame();
}

main();
//placeholder
// let intervalHandle = boardcastClientWaitingForSignal();
