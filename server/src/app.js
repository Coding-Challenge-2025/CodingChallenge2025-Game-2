//fuck commonjs

import express from "express";
import expressWs from "express-ws";
import nodefs from 'node:fs/promises';
import nodepath from 'node:path';
const app = express();
expressWs(app);

import {
    questionsList, keywordsList,
    loadQuestionsList, loadKeywordsList
} from "./problemset.js";

import {
    getRandomRoomId, getRandomIndex,
    randomShuffleArray, fixClientTimepoint, imageFileToBase64,
    waitForAnyKey, getLocalTimeISO8601, logging, startLogging,
    loggingError
} from "./utilities.js";
import * as status from "./status.js"

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

//Store client answer
//Format: [wsobj, string]
const clientAnswerList = new Map();

//Leaderboard, in map
//Format: [wsobj, integer]
const clientScoreList = new Map();

//Store client name and keyword for recording
//Format: [string, string] 
const keywordAnswerRecord = new Map();

//Store client answer timer
//Format: [wsobj, object:{start_time, end_time}]
const clientTimerList = new Map();

let resultArr = [];   //update each play turn, json array contain wsobj, answer, epoch, point
let permitKeywordAnswer = false;
let permitQuestionAnswer = false;
let flagIngame = false;
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
    clientScoreList.set(ws, initialScore);
    currentPlayerCount++;
}

async function loadGameState(filename) {

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

async function broadcastKeywordProperties(keywordObject) {
    let base64Image = await imageFileToBase64("assets/"+keywordObject["image_dir"]);

    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        return status.sendStatusKeyImage(wsObject, {"keyword_length": keywordObject["keyword"].length, "image": base64Image})
    });

    await Promise.all(sendPromises);
}

async function broadcastImpl(callback) {
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if (wsObject.readyState !== WebSocket.OPEN) {
            loggingError(loggingFilename, `Websocket for player ${playerName} is not active!`)
            return Promise.resolve();
        }
        return new Promise(resolve => {
            callback(resolve, wsObject, playerName);
        });
    });
    await Promise.all(sendPromises);
}

async function broadcastQuestion(questionObject) {
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if (wsObject.readyState !== WebSocket.OPEN) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            status.sendStatusLoadQuestion(wsObject, questionObject)

            if(isPlayerActive(wsObject)) {
                logging(loggingFilename, `Question sent to player ${playerName}`)
            } else {
                logging(loggingFilename, `Question sent to player ${playerName} for observation purpose`);
            }

            resolve();
        });
    });
    await Promise.all(sendPromises);
}

//major overhaul
async function broadcastSignalStartQuestion() {

    permitQuestionAnswer = true;
    const clientsPromise = broadcastImpl((resolve, wsObject, playerName) => {
        let serverStartTimepoint = Date.now();
        clientAnswerList.set(wsObject, "");
        clientTimerList.set(wsObject, {"start_time": serverStartTimepoint});
        if(isPlayerActive(wsObject)) {
            status.sendStatusRunQuestion(wsObject);
        }
        resolve()
    })

    const timeoutPromise = new Promise((promise) => {
        const outerTimeoutHandle = setTimeout(() => {
            clearTimeout(outerTimeoutHandle);
            const innerClientsPromise = Array.from(clientTimerList).map(([wsObject, timerObject]) => {
                if(clientAnswerList.get(wsObject) === "") {
                    clientTimerList.set(wsObject, {"start_time": timerObject["start_time"], "end_time": timerObject["start_time"]+ANSWER_TIMEOUT+1})
                }
            });
            Promise.all(innerClientsPromise);
            promise();
        }, ANSWER_TIMEOUT + 1500);  //1.5s intentional delay in case of slowdown
    })
    
    await Promise.all([timeoutPromise, clientsPromise])
    permitQuestionAnswer = false;
}

async function broadcastCheckAnswer(originalQuestionObject) {
    resultArr = [];
    //Notify user first, then build result array later
    const correctAnswer = originalQuestionObject["answer"];
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        //Client shall sent its answer timepoint. If none provided, server timepoint is used
        const playerAnswer = clientAnswerList.get(wsObject);
        const playerStartTimepoint = clientTimerList.get(wsObject)["start_time"];
        const playerEndTimepoint = clientTimerList.get(wsObject)["end_time"];
        const epoch = playerEndTimepoint - playerStartTimepoint;
        status.sendStatusCheckAnswer(wsObject, {"is_correct": (playerAnswer === correctAnswer ? 1 : 0), "correct_answer": correctAnswer});
        resultArr.push({"wsobj": wsObject, "answer": playerAnswer, "epoch": epoch, "point": 0});
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
        if(ele["answer"] === correctAnswer && ele["epoch"] < ANSWER_TIMEOUT) {
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
        status.sendStatusClue(wsObject, {"clue": clueWord});
    })

    await Promise.all(sendPromises);
}

async function broadcastRoundScore() {
    let sendJsonResultArr = [];
    resultArr.map(({wsobj, answer, epoch, point}) => {
        let epochInSecond = epoch/1000;
        logging(loggingFilename, `${epochInSecond.toFixed(3)}s ~ ${getPlayerNameFromHandle(wsobj)}: ${answer} => +${point}`);
        sendJsonResultArr.push({"epoch": epochInSecond, "name": getPlayerNameFromHandle(wsobj), "answer": answer, "point": point});
    })
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        return status.sendStatusRoundScore(wsObject, sendJsonResultArr)
    });

    await Promise.all(sendPromises);
}

async function broadcastLeaderboard() {
    let leaderboardJSONString = JSON.stringify(getLeaderboard()); 
    logging(loggingFilename, leaderboardJSONString);
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        return status.sendStatusLeaderboard(wsObject, getLeaderboard());
    });

    await Promise.all(sendPromises);
}

async function resolveKeywordAnswer(keywordString) {
    for(let ele of keywordAnswerQueue) {
        let clientName = ele["name"];
        let clientKeyword = ele["keyword"];

        let wsobj = getHandleFromPlayerName(clientName);

        clientActiveStateList.set(wsobj, false);
        if(clientKeyword === keywordString) {
            logging(loggingFilename, `Player ${clientName} keyword ${clientKeyword} correct!`);
            updateClientScore(wsobj, KEYWORD_CORRECT_POINT);
            status.sendStatusCheckKeyword({"is_correct": 1});
            status.sendStatusPlayerWin(wsobj);
            return true;
        } else {
            logging(loggingFilename, `Player ${clientName} keyword ${clientKeyword} incorrect`);
            status.sendStatusCheckKeyword({"is_correct": 0});
            status.sendStatusPlayerLose(wsobj);
        }
    }
    keywordAnswerQueue.splice(0);
    return false;
}

async function handleStatusLogin(ws, jsonData) {
    let clientName = jsonData["name"]
    let roomId = jsonData["id"]
    let initialScore = jsonData["score"]

    logging(loggingFilename, `Client name: ${clientName} Client ID: ${roomId}`);

    if(flagIngame) {
        logging(loggingFilename, `Connection refused: Game already running!`);
        status.sendStatusGameAlreadyRunning(ws);
        return;
    } else if(roomId !== serverRoomId) {
        logging(loggingFilename, `Player ${clientName} unauthorized`);
        status.sendStatusInvalidID(ws);
        return;
    } else if(currentPlayerCount >= MAX_PLAYER) {
        logging(loggingFilename, `Player ${clientName} refused. Room is full!`);
        status.sendStatusRoomIsFull(ws);
        return;
    } else if(getHandleFromPlayerName(clientName) !== undefined) {
        logging(loggingFilename, `Player ${clientName} refused. Duplicated name`);
        status.sendStatusDuplicateName(ws);
        return;
    }

    allocateClient(ws, clientName, Number.isInteger(initialScore) ? initialScore : 0);
    logging(loggingFilename, `Player ${clientName} authorized`);
    status.sendStatusAccepted(ws);
}

async function handleStatusAnswer(ws, jsonData) {
    let serverEndTimePoint = Date.now();
    if(permitQuestionAnswer) {
        let clientName = getPlayerNameFromHandle(ws);
        if(jsonData["answer"] === undefined) {
            logging(loggingFilename, `status ANSWER: Player ${clientName} sent status without answer`)
            return;
        } else if(!isPlayerActive(ws)) {
            logging(loggingFilename, `status ANSWER: Player ${clientName} was eliminated, do not accept asnwer`)
            return;
        }
        logging(loggingFilename, `Player ${clientName} sent answer`);
        clientAnswerList.set(ws, jsonData["answer"]);
        let serverStartTimePoint = clientTimerList.get(ws)["start_time"];
        let clientStartTimePoint = jsonData["start"];
        let clientEndTimePoint = jsonData["end"];
        let timePointObject = {
            "server_start" : serverStartTimePoint,
            "server_end"   : serverEndTimePoint,
            "client_start" : clientStartTimePoint,
            "client_end"   : clientEndTimePoint,
        };
        let flagAlreadyTimeout = fixClientTimepoint(timePointObject, ANSWER_TIMEOUT);
        console.log(timePointObject);
        clientTimerList.set(ws, {"start_time": timePointObject["client_start"], "end_time": timePointObject["client_end"]});
    }
}

async function handleStatusKeyword(ws, jsonData) {
    if(permitKeywordAnswer) {
        let clientName = getPlayerNameFromHandle(ws);
        let clientKeyword = jsonData["keyword"];
        if(clientKeyword === undefined) {
            logging(loggingFilename, `status KEYWORD: Player ${clientName} sent status without answer`)
            return;
        } else if(!isPlayerActive(ws)) {
            logging(loggingFilename, `status KEYWORD: Player ${clientName} was eliminated, do not accept keyword`)
            return;
        } else if(keywordAnswerRecord.get(clientName)) {
            logging(loggingFilename, `status KEYWORD: Player ${clientName} already submitted keyword!`)
            return;
        }
        logging(loggingFilename, `Player ${clientName} sent keyword`);
        keywordAnswerQueue.push({"name": clientName, "keyword": clientKeyword});
        keywordAnswerRecord.set(clientName, clientKeyword);
    }
}

app.ws("/", (ws, req) => {
    let clientRemoveAddress = req.socket.remoteAddress
    logging(loggingFilename, `address ${clientRemoveAddress} connected`);

    ws.on("close", () => {
        if (clientList.has(ws)) {
            logging(loggingFilename, `Player ${getPlayerNameFromHandle(ws)} disconnected`);
            releaseClient(ws);
            if(flagIngame === false) {
                logging(loggingFilename, `Player disconnected while already in-game. Must check!`);
                //saveGameState()
                //exit....
            }
        }
    });

    ws.on("error", (err) => {
        loggingError(loggingFilename, "WebSocket error:", err);
    });

    ws.on('message', (msg) => {
        let jsonData
        try {
            jsonData = JSON.parse(msg);
        } catch (error) {
            loggingError(loggingFilename, "Error parsing JSON from client:", error.message);
            return
        }

        let clientStatus = jsonData["status"];
        let clientMessage = jsonData["message"];
        //For now, all status from client have message data, so let it here
        switch(clientStatus) {
            case status.STATUS_LOGIN: {
                handleStatusLogin(ws, clientMessage);
                break;
            }
            case status.STATUS_ANSWER: {
                handleStatusAnswer(ws, clientMessage);
                break;
            }
            case status.STATUS_KEYWORD: {
                handleStatusKeyword(ws, clientMessage);
                break;
            }
        }
    })
});

async function initGame() {
    await loadKeywordsList(process.cwd() + "/assets/keywords.json")
    await loadQuestionsList(process.cwd() + "/assets/questions.json")
    //Empty players
    currentPlayerCount = 0;
    clientList.length = 0;
    flagIngame = false;
    // Shuffle question for more randomness
    randomShuffleArray(questionsList);
}


async function choosePiece(params) {

}

async function prepareClientQuestion(originalQuestionObject, questionIndex) {
    let newObject = JSON.parse(JSON.stringify(originalQuestionObject));
    newObject["answer"] = undefined;
    newObject["piece_index"] = questionIndex;
    return newObject;
}

//waiting for ui...
async function verifyAnswer() {

}

async function ingame() {
    flagIngame = true;
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
        logging(loggingFilename, `Answer hint: ${originalQuestionObject["answer"]}`);
        await broadcastQuestion(questionObject);
        await waitForAnyKey("Press any key to start question");
        await broadcastSignalStartQuestion();
        await waitForAnyKey("Press any key to check answer");
        let anyCorrectAnswerGiven = await broadcastCheckAnswer(originalQuestionObject);
        await waitForAnyKey("Press any key to result");
        await broadcastRoundScore()
        await broadcastClue(selectedKeywordObject, anyCorrectAnswerGiven);
        await waitForAnyKey("Press any key for leaderboard");
        await broadcastLeaderboard();

        if(keywordAnswerQueue.length > 0) await waitForAnyKey("Press any key to resolve keyword answer");
        let winnerFound = await resolveKeywordAnswer(selectedKeywordObject["keyword"]);
        if(winnerFound) {
            broadcastImpl((resolve, wsObject) => {
                status.sendStatusGameEnd(wsObject)
                resolve();
            });
            permitKeywordAnswer = false
            flagIngame = false;
            return;
        }

        await waitForAnyKey("Press any key to next question");
    }

    //can be a long delay here
    permitKeywordAnswer = false;
    flagIngame = false;
    broadcastImpl((resolve, wsObject) => {
        status.sendStatusGameEnd(wsObject)
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
            status.sendStatusWaitingForEvent(client[0]);
        }
        if (currentPlayerCount >= 2) {
            clearInterval(intervalHandle);
            logging(loggingFilename, "Starting game...")
            for (let client of clientList) {
                status.sendStatusGameStart(client[0]);
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
