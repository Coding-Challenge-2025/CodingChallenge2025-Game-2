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

//Store client answer correct/incorrect status
//Format: [wsobj, bool]
const clientAnswerCorrectList = new Map();

//Leaderboard, in map
//Format: [wsobj, integer]
const clientScoreList = new Map();

//Store client name and keyword for recording
//Format: [string, string] 
const keywordAnswerRecord = new Map();

//Store client answer timer
//Format: [wsobj, object:{start_time, end_time}]
const clientTimerList = new Map();

//Store audience players list
//Format: [wsobj, bool]
const clientAudienceList = new Map();

let permitKeywordAnswer = false;
let permitQuestionAnswer = false;
let flagIngame = false;
const keywordQueue = [];
const ANSWER_TIMEOUT = 20000 
// const KEYWORD_CORRECT_POINT = 80

let roundScoreArray = []

let serverRoomId
let currentPlayerCount = 0
let questionCounter = 0

let selectedKeywordObject;
let selectedQuestionObject;

let loggingFilename;
let waitingRoomHandle;

const hostPassword = "C0d1nCh@llenge25"
const hostName = "ADMIN"
//Host ws object
let hostHandle = undefined;

function isHost(ws) {
    return hostHandle === ws ? true : false;
}

function isHostActive() {
    return hostHandle === undefined ? false : true 
}

function allocateHost(ws) {
    hostHandle = ws;
    clientList.set(hostHandle, hostName);
    clientNameList.set(hostName, hostHandle);
    clientActiveStateList.set(hostHandle, false);
}

function releaseHost() {
    clientList.delete(hostHandle);
    clientNameList.delete(hostName);
    clientActiveStateList.delete(hostHandle);
    hostHandle = undefined;
}

function releaseClient(ws) {
    let playerName = getClientNameFromHandle(ws);
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

function releaseAudience(ws) {
    clientList.delete(ws);
    clientActiveStateList.delete(ws);
    clientAudienceList.delete(ws);
}

function allocateAudience(ws, audienceName) {
    clientList.set(ws, audienceName)
    clientActiveStateList.set(ws, false);
    clientAudienceList.set(ws, true);
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

function getClientNameFromHandle(wsObject) {
    return clientList.get(wsObject);
}

function getHandleFromClientName(playerName) {
    return clientNameList.get(playerName);
}

function isPlayerActive(wsObject) {
    return clientActiveStateList.get(wsObject) === true ? true : false;
}

function isPlayerAudience(wsObject) {
    return clientAudienceList.get(wsObject) === true ? true : false;
}

function getLeaderboard() {
    let jsonLeaderboard = [];
    Array.from(clientScoreList).map(([wsObject, score]) => {
        jsonLeaderboard.push({"name": getClientNameFromHandle(wsObject), "score": score});
    })
    return jsonLeaderboard;
}

function getRoundScore() {
    return roundScoreArray;
}

async function prepareHostKeyImage(keywordObject) {
    let base64Image = await imageFileToBase64("assets/"+keywordObject["image_dir"]);
    const convertedObj = {"keyword": keywordObject["keyword"], "image": base64Image};
    return convertedObj
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
    const sendPromises = Array.from(clientList).map(([wsObject, clientName]) => {
        if (wsObject.readyState !== WebSocket.OPEN) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            status.sendStatusLoadQuestion(wsObject, questionObject)

            if(isPlayerAudience(wsObject)) {
                logging(loggingFilename, `Question sent to audience ${clientName} for observation purpose`);
            } else if(isHost(wsObject)) {
                logging(loggingFilename, `Question sent to host for whatever purpose`);
            } else if(isPlayerActive(wsObject)) {
                logging(loggingFilename, `Question sent to player ${clientName}`)
            } else {
                logging(loggingFilename, `Question sent to player ${clientName} for observation purpose`);
            }

            resolve();
        });
    });
    await Promise.all(sendPromises);
}

async function broadcastShowKeyword(keywordObject) {
    broadcastImpl((resolve, wsObject, playerName) => {
        status.sendStatusShowKeyword(wsObject, keywordObject);
        resolve()
    });
}

//major overhaul
async function broadcastSignalStartQuestion() {

    permitQuestionAnswer = true;
    const clientsPromise = broadcastImpl((resolve, wsObject, playerName) => {
        if(isPlayerAudience(wsObject) || isHost(wsObject)) {
            //Only send status, do not add to timer list
            status.sendStatusRunQuestion(wsObject);
            return resolve();
        }
        let serverStartTimepoint = Date.now();
        clientAnswerList.set(wsObject, "");
        clientTimerList.set(wsObject, {"start_time": serverStartTimepoint});
        // if(isPlayerAudience(wsObject) || isPlayerActive(wsObject)) {
            status.sendStatusRunQuestion(wsObject);
        // }
        resolve()
    })

    const timeoutPromise = new Promise((promise) => {
        const outerTimeoutHandle = setTimeout(() => {
            clearTimeout(outerTimeoutHandle);
            //audience doesn't in clientTimerList so they won't be caught here 
            const innerClientsPromise = Array.from(clientTimerList).map(([wsObject, timerObject]) => {
                if(clientAnswerList.get(wsObject) === "") {
                    if(isPlayerActive(wsObject)) logging(loggingFilename, `Player ${getClientNameFromHandle(wsObject)} didn't send answer`);
                    else logging(loggingFilename, `Player ${getClientNameFromHandle(wsObject)} didn't send answer due to eliminated`);
                    clientTimerList.set(wsObject, {"start_time": timerObject["start_time"], "end_time": timerObject["start_time"]+ANSWER_TIMEOUT+1})
                }
            });
            Promise.all(innerClientsPromise);
            promise();
        }, ANSWER_TIMEOUT + 1500);  //1.5s intentional delay in case of slowdown
    })
    
    await Promise.all([timeoutPromise, clientsPromise])
    permitQuestionAnswer = false;
    await status.sendStatusHostNotifyTimesup(hostHandle);
    let answerQueueSending = prepareAnswerQueue();
    await status.sendStatusHostAnswerQueue(hostHandle, answerQueueSending);
}

function prepareAnswerQueue() {
    let answerQueueSending = [];
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if(isPlayerAudience(wsObject) || isHost(wsObject)) return;
        const playerAnswer = clientAnswerList.get(wsObject);
        const playerStartTimepoint = clientTimerList.get(wsObject)["start_time"];
        const playerEndTimepoint = clientTimerList.get(wsObject)["end_time"];
        const epoch = playerEndTimepoint - playerStartTimepoint;
        answerQueueSending.push({"name": playerName, "answer": playerAnswer, "epoch": epoch, "point": 0});
    });
    
    return answerQueueSending;
}

async function broadcastClue(keywordObject, doSendClue) {
    let selectedIndex = getRandomIndex(keywordObject["clues"]);
    let clueWord = null;
    if(doSendClue) {
        clueWord = keywordObject["clues"][selectedIndex];
        logging(loggingFilename, `Do open clue: ${clueWord}`);
    } else logging(loggingFilename, `Do not open clue`);
    //discard for nothing in case of all incorrect answer
    keywordObject["clues"].splice(selectedIndex, 1);       
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        status.sendStatusClue(wsObject, {"clue": clueWord});
    })

    await Promise.all(sendPromises);
}

function prepareRoundScore() {
    roundScoreArray = [];
    Array.from(clientAnswerList).map(([wsObject, answer]) => {
        let clientName = getClientNameFromHandle(wsObject)
        let startTime = clientTimerList.get(wsObject)["start_time"];
        let endTime = clientTimerList.get(wsObject)["end_time"];
        let epochInSecond = (endTime - startTime)/1000;
        let point = clientAnswerCorrectList.get(wsObject) ? 10 : 0
        logging(loggingFilename, `${epochInSecond.toFixed(3)}s ~ ${clientName}: ${answer} => +${point}`);
        roundScoreArray.push({"epoch": epochInSecond, "name": clientName, "answer": answer, "point": point});
    })
}

async function broadcastRoundScore() {
    logging(loggingFilename, "Log round score:")
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        return status.sendStatusRoundScore(wsObject, getRoundScore())
    });

    await Promise.all(sendPromises);
}

async function broadcastLeaderboard() {
    let leaderboardJSONString = JSON.stringify(getLeaderboard()); 
    logging(loggingFilename, `Log leaderboard: ${leaderboardJSONString}`);
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        return status.sendStatusLeaderboard(wsObject, getLeaderboard());
    });

    await Promise.all(sendPromises);
}

async function resolveKeyword(resolvedKeywordArray) {
    let foundWinner = false;

    for(let ele of resolvedKeywordArray) {
        let clientName = ele["name"];
        let clientCorrect = ele["correct"];
        let wsobj = getHandleFromClientName(clientName);
        clientActiveStateList.set(wsobj, false);
        if(clientCorrect) {
            if(foundWinner) loggingError(loggingFilename, "A player was decleared winner, now found another one?");
            logging(loggingFilename, `Player ${clientName} correct keyword sent`);
            updateClientScore(wsobj, (12-questionCounter)*10);
            status.sendStatusCheckKeyword({"correct": 1});
            status.sendStatusPlayerWin(wsobj);
            foundWinner = true;
        } else {
            logging(loggingFilename, `Player ${clientName} incorrect keyword sent`);
            status.sendStatusCheckKeyword({"correct": 0});
            status.sendStatusPlayerLose(wsobj);
        }
    }
    keywordQueue.splice(0);
    return foundWinner;
}

async function handleStatusAudienceLogin(ws, jsonData) {
    let clientName = jsonData["name"]
    let roomId = jsonData["id"]
    logging(loggingFilename, `Audience name: ${clientName} Audience ID: ${roomId}`);
    if(roomId !== serverRoomId) {
        logging(loggingFilename, `Audience ${clientName} unauthorized`);
        status.sendStatusInvalidID(ws);
        return;
    } else if(getHandleFromClientName(clientName) !== undefined) {
        logging(loggingFilename, `Audience ${clientName} refused. Duplicated name`);
        status.sendStatusDuplicateName(ws);
        return;
    }

    allocateAudience(ws,clientName);
    logging(loggingFilename, `Audience ${clientName} authorized`);
    status.sendStatusAccepted(ws);
}

async function handleStatusLogin(ws, jsonData) {
    let clientName = jsonData["name"]
    let roomId = jsonData["id"]
    let initialScore = jsonData["score"]

    logging(loggingFilename, `Client name: ${clientName} Client ID: ${roomId}`);

    if(flagIngame) {
        logging(loggingFilename, `Connection refused: Game already running!`);
        status.sendStatusGameAlreadyRunning(ws);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} refused: Game already running!`)
        return;
    } else if(roomId !== serverRoomId) {
        logging(loggingFilename, `Player ${clientName} unauthorized`);
        status.sendStatusInvalidID(ws);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} refused: Invalid ID`)
        return;
    } else if(currentPlayerCount >= MAX_PLAYER) {
        logging(loggingFilename, `Player ${clientName} refused. Room is full!`);
        status.sendStatusRoomIsFull(ws);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} refused: Room is full!`)
        return;
    } else if(getHandleFromClientName(clientName) !== undefined) {
        logging(loggingFilename, `Player ${clientName} refused. Duplicated name`);
        status.sendStatusDuplicateName(ws);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} refused: Duplicated name`)
        return;
    }

    allocateClient(ws, clientName, Number.isInteger(initialScore) ? initialScore : 0);
    logging(loggingFilename, `Player ${clientName} authorized`);
    if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} authorized`)
    status.sendStatusAccepted(ws);
}

async function handleStatusAnswer(ws, jsonData) {
    let serverEndTimePoint = Date.now();
    if(permitQuestionAnswer && !isPlayerAudience(ws)) {
        let clientName = getClientNameFromHandle(ws);
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
    if(permitKeywordAnswer && !isPlayerAudience(ws)) {
        let clientName = getClientNameFromHandle(ws);
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
        logging(loggingFilename, `Player ${clientName} sent keyword ${clientKeyword}`);
        const keywordObject = {"name": clientName, "keyword": clientKeyword};
        keywordQueue.push(keywordObject);
        keywordAnswerRecord.set(clientName, clientKeyword);
        await status.sendStatusHostNotifyKeyword(hostHandle, keywordObject);
    }
}

async function handleStatusHostLogin(ws, jsonData) {
    let roomId = jsonData["id"]
    let password = jsonData["password"];
    // if(roomId === serverRoomId && password === hostPassword) {   //frontend didn't like this lol
    if(password === hostPassword) {
        allocateHost(ws)
        logging(loggingFilename, "Host authorized")
        await status.sendStatusAccepted(ws);
        await status.sendStatusNotify(ws, `Connect others with room ID ${serverRoomId}`)
    } else {
        logging(loggingFilename, "Host failed to login");   
        await status.sendStatusInvalidID(ws);
    }
}

app.ws("/", (ws, req) => {
    let clientRemoveAddress = req.socket.remoteAddress
    logging(loggingFilename, `address ${clientRemoveAddress} connected`);

    ws.on("close", () => {
        if(isHost(ws)) {
            logging(loggingFilename, "Host has disconnected!");
            releaseHost();
            return;
        }
        if (clientList.has(ws)) {
            if(isPlayerAudience(ws)) {
                logging(loggingFilename, `Audience ${getClientNameFromHandle(ws)} disconnected`);
                releaseAudience(ws);
                return;
            }
            if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${getClientNameFromHandle(ws)} disconnected`)
            logging(loggingFilename, `Player ${getClientNameFromHandle(ws)} disconnected`);
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
            case status.STATUS_AUDIENCELOGIN: {
                handleStatusAudienceLogin(ws, clientMessage);
                break;
            }
            case status.STATUS_HOSTLOGIN: {
                handleStatusHostLogin(ws, clientMessage);
                break;
            }
            case status.STATUS_HOSTGAMESTART: {
                if(isHost(ws)) startGame();
                break;
            }
            case status.STATUS_HOSTGAMEEND: {
                if(!isHost(ws)) break;
                permitKeywordAnswer = false;
                flagIngame = false;
                logging(loggingFilename, "Host requested end game!");
                for(let client of clientList) {
                    status.sendStatusGameEnd(client[0], selectedKeywordObject);
                }
                break;
            }
            case status.STATUS_CHOOSEPIECE: {
                if(!isHost(ws)) break;
                let piece_index = clientMessage["piece_index"]
                choosePiece(piece_index);
                break;
            }
            case status.STATUS_HOSTQUESTIONRUN: {
                if(!isHost(ws)) break;
                broadcastSignalStartQuestion();
                break;
            }
            case status.STATUS_SHOWKEYWORD: {
                broadcastShowKeyword(clientMessage)
                break;
            }
            case status.STATUS_KEYWORDRESOLVE: {
                resolveKeyword(clientMessage);
                break;
            }

            case status.STATUS_ANSWERRESOLVE: {
                const tempWrapper = async() => {
                    await resolveAnswer(clientMessage);
                    prepareRoundScore()
                }
                tempWrapper();
                break;
            }
            case status.STATUS_SETSCORE: {
                if(!isHost(ws)) break;
                let clientName = clientMessage["name"]
                let scoreToSet = clientMessage["score"];
                if(Number.isInteger(scoreToSet)) {
                    let wsObject = getHandleFromClientName(clientName);
                    if(wsObject !== undefined) {
                        clientScoreList.set(wsObject, scoreToSet);
                        logging(loggingFilename, `Client ${clientName} score has been set to ${scoreToSet}`)
                    }
                }
                break;
            }
            case status.STATUS_OPENCLUE: {
                if(!isHost(ws)) break;
                broadcastClue(selectedKeywordObject, true);
                break;
            }
            case status.STATUS_NOCLUE: {
                if(!isHost(ws)) break;
                broadcastClue(selectedKeywordObject, false);
                break;
            }
            case status.STATUS_GETLEADERBOARD: {
                broadcastLeaderboard()
                break;
            }
            case status.STATUS_GETROUNDSCORE: {
                broadcastRoundScore()    //currently broken
                break;
            }
            case status.STATUS_GETCLIENTS: {
                const tempWrapper = async() => {
                    let convertedClientsListObject = {};
                    convertedClientsListObject["audiences"] = []
                    convertedClientsListObject["players"] = []
                    Array.from(clientList).map(([wsObject, playerName]) => {
                        if(isHost(wsObject)) return;
                        else if(isPlayerAudience(wsObject)) {
                            convertedClientsListObject["audiences"].push(playerName)
                        } else {
                            convertedClientsListObject["players"].push(playerName)
                        }
                    })
                    await status.sendStatusHostClientsList(hostHandle, convertedClientsListObject)
                }
                tempWrapper();
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

async function resolveAnswer(resolvedAnswerQueue) {
    const correctAnswer = selectedQuestionObject["answer"];
    const sendPromisesPlayers = Array.from(resolvedAnswerQueue).map(({name, correct}) => {
        let wsobj = getHandleFromClientName(name);
        if(wsobj === undefined) return Promise.resolve();
        if(correct) {
            updateClientScore(wsobj, 10)
            clientAnswerCorrectList.set(wsobj, true)
        } else {
            clientAnswerCorrectList.set(wsobj, false)
        }
        status.sendStatusCheckAnswer(wsobj, {"correct": correct, "correct_answer": correctAnswer});
        return Promise.resolve();
    })

    const sendPromisesAudiences = broadcastImpl((resolve, wsObject, playerName) => {
        if(isPlayerAudience(wsObject) || isHost(wsObject)) {
            status.sendStatusCheckAnswer(wsObject, {"correct": 1, "correct_answer": correctAnswer});
        }
        resolve();
    })

    questionCounter++;
    
    await Promise.all([sendPromisesPlayers, sendPromisesAudiences]);
}

async function choosePiece(piece_index) {
    clientAnswerCorrectList.clear();
    let givenIndex = getRandomIndex(questionsList);
    selectedQuestionObject = { ...questionsList[givenIndex] };
    questionsList.splice(givenIndex, 1);
    let questionObject = await prepareClientQuestion(selectedQuestionObject, piece_index);
    let hostQuestionObject = prepareHostQuestion(selectedQuestionObject, piece_index);
    logging(loggingFilename, `Answer hint: ${selectedQuestionObject["answer"]}`);
    await broadcastQuestion(questionObject);
    await status.sendStatusHostQuestionLoad(hostHandle, hostQuestionObject);
}

async function prepareClientQuestion(originalQuestionObject, questionIndex) {
    let newObject = JSON.parse(JSON.stringify(originalQuestionObject));
    newObject["answer"] = undefined;
    newObject["piece_index"] = questionIndex;
    return newObject;
}

function prepareHostQuestion(originalQuestionObject, questionIndex) {
    let newObject = JSON.parse(JSON.stringify(originalQuestionObject));
    newObject["piece_index"] = questionIndex;
    return newObject;
}

async function startGame() {
    // const startGamePlayerCount = MAX_PLAYER
    const startGamePlayerCount = 1;
    questionCounter = 0;
    if(flagIngame) {
        logging(loggingFilename, "Host trying to start game, but game is already running!");
        status.sendStatusNotify(hostHandle, "game is already running");
    } else if(currentPlayerCount < startGamePlayerCount) {
        logging(loggingFilename, "Host trying to start game, but not enough player!");
        status.sendStatusNotify(hostHandle, "not enough player");
    } else {
        clearInterval(waitingRoomHandle);
        logging(loggingFilename, "Starting game...")
        await broadcastImpl((resolve, wsObject, playername) => {
            status.sendStatusGameStart(wsObject);
            resolve();
        })
        flagIngame = true;
        permitKeywordAnswer = true;
        selectedKeywordObject = keywordsList[getRandomIndex(keywordsList)];
        logging(loggingFilename, `Selected keyword: ${selectedKeywordObject["keyword"]}`)
        status.sendStatusNotify(hostHandle, `Selected keyword: ${selectedKeywordObject["keyword"]}`);
        randomShuffleArray(selectedKeywordObject["clues"]);
        await broadcastKeywordProperties(selectedKeywordObject);
        await status.sendStatusHostKeyImage(hostHandle, await prepareHostKeyImage(selectedKeywordObject));
    }
}

async function waitingRoom() {
    waitingRoomHandle = setInterval(() => {
        for (let client of clientList) {
            status.sendStatusWaitingForEvent(client[0]);
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
    await waitingRoom();
}

main();
