//fuck commonjs

import express from "express";
import expressWs from "express-ws";
import https from 'https';
import nodefs from 'node:fs';
import nodepath from 'node:path';

//generate key: openssl req -newkey rsa:2048 -nodes -keyout domain.key -x509 -days 365 -out domain.crt
const certOption = {
    key: nodefs.readFileSync(process.cwd() + '/key/server.key'),
    cert: nodefs.readFileSync(process.cwd() + '/key/server.crt')
};

const app = express();
const server = https.createServer(certOption, app);
expressWs(app, server);

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
// import * as parser from "./argparse.js"
import {GameStateFlag} from "./gamestateflag.js"


const MAX_PLAYER = 4;
const port = 3000;

//Format: [wsobj, string]
const clientList = new Map();               

//Format: [string, wsobj]
const clientNameList = new Map();         

//Store boolean value determine if client 
//is still able to participate in the game
//Format: [string, boolean]
const clientActiveStateList = new Map();

//Store client answer
//Format: [string, string]
const clientAnswerList = new Map();

//Store client answer correct/incorrect status
//Format: [string, bool]
const clientAnswerCorrectList = new Map();

//Leaderboard, in map
//Format: [string, integer]
const clientScoreList = new Map();

//Store client name and keyword for recording
//Format: [string, string] 
const keywordAnswerRecord = new Map();

//Store client answer timer
//Format: [string, object:{start_time, end_time}]
const clientTimerList = new Map();

//Store audience players list
//Format: [ws, bool]
const clientAudienceList = new Map();

//Store unique players that has ever login
const clientUniqueNameSet = new Set();

//Array of {index: integer, correct: bool, clue: string}
let gameState = []

const gameStateFlag = new GameStateFlag();

let permitKeywordAnswer = false;
const keywordQueue = [];
const ANSWER_TIMEOUT = 20000 
let globalTimer = ANSWER_TIMEOUT
// const KEYWORD_CORRECT_POINT = 80

let roundScoreArray = []

let serverRoomId
let currentPlayerCount = 0
let questionCounter = 0
let currentPieceIndex

let selectedKeywordObject;
let selectedQuestionObject;

export let loggingFilename;
let waitingRoomHandle;

const hostPassword = "C0d1nCh@llenge25"
const hostName = "ADMIN"
//Host ws object
let hostHandle = undefined;

function isHost(ws) {
    if(!isHostActive()) return false;
    return hostHandle === ws ? true : false;
}

function isHostActive() {
    return hostHandle === undefined ? false : true 
}

function allocateHost(ws) {
    hostHandle = ws;
    clientList.set(hostHandle, hostName);
    clientNameList.set(hostName, hostHandle);
    clientActiveStateList.set(hostName, false);
    clientUniqueNameSet.add(hostName);
}

function releaseHost() {
    clientList.delete(hostHandle);
    clientNameList.delete(hostName);
    // clientActiveStateList.delete(hostHandle);
    hostHandle = undefined;
}

function releaseClient(ws) {
    let playerName = getClientNameFromHandle(ws);
    clientList.delete(ws);
    // clientActiveStateList.delete(ws);
    // clientAnswerList.delete(ws);
    // clientScoreList.delete(ws);
    clientNameList.delete(playerName);
    // if(keywordAnswerRecord.has(playerName)) keywordAnswerRecord.delete(playerName);
    currentPlayerCount--;
}

async function restoreClient(ws, clientName) {
    clientList.set(ws, clientName)
    clientNameList.set(clientName, ws);
    currentPlayerCount++;

    if(gameStateFlag.startGame) {
        await status.sendStatusGameStart(ws);
        await status.sendStatusLoadGameState(ws, gameState);
        if(isHost(ws)) {
            await status.sendStatusKeyImage(ws, await selectedKeywordObject)
        } else {
            await status.sendStatusKeyImage(ws, await prepareClientKeyImage(selectedKeywordObject))
        }
    }
    if(gameStateFlag.qload) {
        await status.sendStatusLoadQuestion(ws, await prepareClientQuestion(selectedQuestionObject, currentPieceIndex))
    }
    if(gameStateFlag.qrun) {
        await status.sendStatusRunQuestion(ws, globalTimer);
    }
}

function allocateClient(ws, clientName, initialScore = 0) {
    clientList.set(ws, clientName)
    clientActiveStateList.set(clientName, true);
    clientAnswerList.set(clientName, undefined);
    clientScoreList.set(clientName, 0);
    clientNameList.set(clientName, ws);
    clientScoreList.set(clientName, initialScore);
    clientUniqueNameSet.add(clientName);
    currentPlayerCount++;
}

function releaseAudience(ws) {
    // clientList.delete(ws);
    // clientActiveStateList.delete(ws);
    // clientAudienceList.delete(ws);
}

function allocateAudience(ws, audienceName) {
    clientList.set(ws, audienceName)
    clientNameList.set(audienceName, ws);
    clientActiveStateList.set(audienceName, false);
    clientAudienceList.set(audienceName, true);
}

async function loadGameState(filename) {
    // await nodefs.readFile(filename, )
}

function updateClientScore(wsObj, scoreAdded) {
    const clientName = getClientNameFromHandle(wsObj);
    if(clientScoreList.has(clientName)) {
        let currentClientScore = clientScoreList.get(clientName);
        currentClientScore += scoreAdded;
        clientScoreList.set(clientName, currentClientScore);
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

function isPlayerActive(playerName) {
    return clientActiveStateList.get(playerName) === true ? true : false;
}

function isPlayerAudience(playerName) {
    return clientAudienceList.get(playerName) === true ? true : false;
}

function getLeaderboard() {
    let jsonLeaderboard = [];
    Array.from(clientScoreList).map(([clientName, score]) => {
        jsonLeaderboard.push({"name": clientName, "score": score});
    })
    return jsonLeaderboard;
}

function getRoundScore() {
    return roundScoreArray;
}

async function prepareKeyImage(selectedObject) {
    let base64Image = await imageFileToBase64("assets/"+selectedObject["image_dir"]);
    selectedKeywordObject = JSON.parse(JSON.stringify(selectedObject))
    selectedKeywordObject["image_dir"] = undefined;
    selectedKeywordObject["image"] = base64Image;
}

function prepareClientKeyImage() {
    let clientSelectedKeywordObject = JSON.parse(JSON.stringify(selectedKeywordObject));
    clientSelectedKeywordObject["keyword_length"] = clientSelectedKeywordObject["keyword"].length;
    clientSelectedKeywordObject["keyword"] = undefined;
    return clientSelectedKeywordObject;
}

async function broadcastKeywordProperties(keywordObject) {
    let prepared = prepareClientKeyImage()

    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        return status.sendStatusKeyImage(wsObject, prepared)
    });

    await Promise.all(sendPromises);
}

/**
 * 
 * @callback broadcastImplCallback
 * @param {function(): Promise<void>} resolve
 * @param {WebSocket} wsObject
 * @param {string} playername 
 * @returns {void}
 * @param {broadcastImplCallback} callback
 * @returns {Promise<void>}
 */
async function broadcastImpl(callback) {
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if (wsObject.readyState !== WebSocket.OPEN) {
            // loggingError(loggingFilename, `Websocket for player ${playerName} is not active!`)
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

            if(isPlayerAudience(clientName)) {
                logging(loggingFilename, `Question sent to audience ${clientName} for observation purpose`);
            } else if(isHost(wsObject)) {
                logging(loggingFilename, `Question sent to host for whatever purpose`);
            } else if(isPlayerActive(clientName)) {
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

    gameStateFlag.qrun = true;
    const clientsPromise = broadcastImpl((resolve, wsObject, playerName) => {
        if(isPlayerAudience(playerName) || isHost(wsObject)) {
            //Only send status, do not add to timer list
            status.sendStatusRunQuestion(wsObject, ANSWER_TIMEOUT);
            return resolve();
        }
        let serverStartTimepoint = Date.now();
        clientAnswerList.set(playerName, "");
        clientTimerList.set(playerName, {"start_time": serverStartTimepoint});
        status.sendStatusRunQuestion(wsObject, ANSWER_TIMEOUT);
        resolve()
    })

    const timeoutPromise = new Promise((promise) => {
        const outerTimeoutHandle = setTimeout(() => {
            clearTimeout(outerTimeoutHandle);
            //audience doesn't in clientTimerList so they won't be caught here 
            const innerClientsPromise = Array.from(clientTimerList).map(([playerName, timerObject]) => {
                let wsObject = getHandleFromClientName(playerName);
                if(clientAnswerList.get(playerName) === "") {
                    if(isPlayerActive(playerName)) logging(loggingFilename, `Player ${playerName} didn't send answer`);
                    else logging(loggingFilename, `Player ${playerName} didn't send answer due to eliminated`);
                    clientTimerList.set(playerName, {"start_time": timerObject["start_time"], "end_time": timerObject["start_time"]+ANSWER_TIMEOUT+1})
                }
            });
            Promise.all(innerClientsPromise);
            promise();
        }, ANSWER_TIMEOUT + 1500);  //1.5s intentional delay in case of slowdown
    })

    const timeoutPromise2 = new Promise((promise) => {
        const countdownAmount = 250;
        globalTimer = ANSWER_TIMEOUT
        const countdown = setInterval(() => {
            globalTimer -= countdownAmount
            if(globalTimer <= 0) {
                clearInterval(countdown)
                promise();
            }
        }, countdownAmount);
    })
    
    await Promise.all([timeoutPromise, timeoutPromise2, clientsPromise])
    gameStateFlag.qrun = false;
    gameStateFlag.qload = false; 
    await status.sendStatusHostNotifyTimesup(hostHandle);
    let answerQueueSending = prepareAnswerQueue();
    await status.sendStatusHostAnswerQueue(hostHandle, answerQueueSending);
    await broadcastImpl((resolve, wsObject, playername) => {
        if(isPlayerAudience(playername)) {
            status.sendStatusHostAnswerQueue(wsObject, answerQueueSending);
            resolve();
        }
    })
}

function prepareAnswerQueue() {
    let answerQueueSending = [];
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        if(isPlayerAudience(playerName) || isHost(wsObject)) return;
        const playerAnswer = clientAnswerList.get(playerName);
        const playerStartTimepoint = clientTimerList.get(playerName)["start_time"];
        const playerEndTimepoint = clientTimerList.get(playerName)["end_time"];
        const epoch = playerEndTimepoint - playerStartTimepoint;
        answerQueueSending.push({"name": playerName, "answer": playerAnswer, "epoch": epoch, "point": 0});
    });
    
    return answerQueueSending;
}

async function broadcastClue(keywordObject, clueIndex, doSendClue) {
    let clueWord = null;
    if(doSendClue) {
        clueWord = keywordObject["clues"][clueIndex];
        logging(loggingFilename, `Do open clue: ${clueWord}`);
    } else logging(loggingFilename, `Do not open clue`);   
    gameState[gameState.length-1]["clue"] = clueWord;
    const sendPromises = Array.from(clientList).map(([wsObject, playerName]) => {
        status.sendStatusClue(wsObject, clueWord, clueIndex);
    })

    await Promise.all(sendPromises);
}

function prepareRoundScore() {
    roundScoreArray = [];
    Array.from(clientAnswerList).map(([clientName, answer]) => {
        let startTime = clientTimerList.get(clientName)["start_time"];
        let endTime = clientTimerList.get(clientName)["end_time"];
        let epochInSecond = (endTime - startTime)/1000;
        let point = clientAnswerCorrectList.get(clientName) ? 10 : 0
        logging(loggingFilename, `${epochInSecond.toFixed(3)}s ~ ${clientName}: ${answer} => +${point}`);
        roundScoreArray.push({"epoch": epochInSecond, "name": clientName, "answer": answer, "point": point});
    })
}

async function broadcastRoundScore() {
    logging(loggingFilename, `Log round score: ${JSON.stringify(getRoundScore())}`)
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
        clientActiveStateList.set(clientName, false);
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

    if(roomId !== serverRoomId) {
        logging(loggingFilename, `Player ${clientName} unauthorized`);
        status.sendStatusInvalidID(ws);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} refused: Invalid ID`)
        return;
    } else if(currentPlayerCount >= MAX_PLAYER) {
        logging(loggingFilename, `Player ${clientName} refused. Room is full!`);
        status.sendStatusRoomIsFull(ws);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} refused: Room is full!`)
        return;
    } 

    if(!clientUniqueNameSet.has(clientName)) {
        allocateClient(ws, clientName, Number.isInteger(initialScore) ? initialScore : 0);
        logging(loggingFilename, `Player ${clientName} authorized`);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} authorized`)
        status.sendStatusAccepted(ws);
    } else if(clientUniqueNameSet.has(clientName) && clientNameList.has(clientName)) {
        logging(loggingFilename, `Player ${clientName} refused. Duplicated name`);
        status.sendStatusDuplicateName(ws);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} refused: Duplicated name`)
        return;
    } else {
        logging(loggingFilename, `Player ${clientName} authorized`);
        if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} authorized`)
        status.sendStatusAccepted(ws);
        await restoreClient(ws, clientName);
    }
}

async function handleStatusAnswer(ws, jsonData) {
    let serverEndTimePoint = Date.now();
    let clientName = getClientNameFromHandle(ws);
    if(gameStateFlag.qrun && !isPlayerAudience(clientName)) {
        if(jsonData["answer"] === undefined) {
            logging(loggingFilename, `status ANSWER: Player ${clientName} sent status without answer`)
            return;
        } else if(!isPlayerActive(clientName)) {
            logging(loggingFilename, `status ANSWER: Player ${clientName} was eliminated, do not accept asnwer`)
            return;
        }
        logging(loggingFilename, `Player ${clientName} sent answer`);
        clientAnswerList.set(clientName, jsonData["answer"]);
        let serverStartTimePoint = clientTimerList.get(clientName)["start_time"];
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
        clientTimerList.set(clientName, {"start_time": timePointObject["client_start"], "end_time": timePointObject["client_end"]});
    }
}

async function handleStatusKeyword(ws, jsonData) {
    let clientName = getClientNameFromHandle(ws);
    if(permitKeywordAnswer && !isPlayerAudience(clientName)) {
        let clientKeyword = jsonData["keyword"];
        if(clientKeyword === undefined) {
            logging(loggingFilename, `status KEYWORD: Player ${clientName} sent status without answer`)
            return;
        } else if(!isPlayerActive(clientName)) {
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
        broadcastImpl((resolve, wsObject, playerName) => {
            status.sendStatusHostNotifyKeyword(wsObject, keywordObject);
            resolve();
        })
    }
}

async function handleStatusHostLogin(ws, jsonData) {
    let roomId = jsonData["id"]
    let password = jsonData["password"];
    // if(roomId === serverRoomId && password === hostPassword) {   //frontend didn't like this lol
    if(password === hostPassword) {
        if(!gameStateFlag.hostEverLogin) {
            gameStateFlag.hostEverLogin = true;
            allocateHost(ws)
            logging(loggingFilename, "Host authorized")
            await status.sendStatusAccepted(ws);
            await status.sendStatusNotify(ws, `Connect others with room ID ${serverRoomId}`)
        } else {
            logging(loggingFilename, "Host reconnected")
            hostHandle = ws;
            await status.sendStatusAccepted(ws);
            await status.sendStatusLoadGameState(ws, gameState);
            // await restoreClient(ws);
        }
    } else {
        logging(loggingFilename, "Host failed to login");   
        await status.sendStatusInvalidPassword(ws);
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
        let clientName = getClientNameFromHandle(ws);
        if (clientList.has(ws)) {
            if(isPlayerAudience(clientName)) {
                logging(loggingFilename, `Audience ${clientName} disconnected`);
                releaseAudience(ws);
                return;
            }
            if(isHostActive()) status.sendStatusNotify(hostHandle, `Player ${clientName} disconnected`)
            logging(loggingFilename, `Player ${clientName} disconnected`);
            releaseClient(ws);
            if(gameStateFlag.startGame) {
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
                gameStateFlag.startGame = false;
                logging(loggingFilename, "Host requested end game!");
                const wrapper = async() => {
                    await broadcastLeaderboard();
                    for(let client of clientList) {
                        status.sendStatusGameEnd(client[0], selectedKeywordObject);
                    }
                }
                wrapper();
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
                let piece_index =  currentPieceIndex;
                if(clientMessage !== undefined && clientMessage["piece_index"] !== undefined) piece_index = clientMessage["piece_index"];
                broadcastClue(selectedKeywordObject, piece_index, true);
                break;
            }
            case status.STATUS_NOCLUE: {
                if(!isHost(ws)) break;
                let piece_index = clientMessage["piece_index"]
                broadcastClue(selectedKeywordObject, piece_index, false);
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
                if(!isHost(ws)) break;
                const tempWrapper = async() => {
                    let convertedClientsListObject = {};
                    convertedClientsListObject["audiences"] = []
                    convertedClientsListObject["players"] = []
                    Array.from(clientList).map(([wsObject, playerName]) => {
                        if(isHost(wsObject)) return;
                        else if(isPlayerAudience(playerName)) {
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
    gameStateFlag.startGame = false;
    // Shuffle question for more randomness
    randomShuffleArray(questionsList);
}

async function resolveAnswer(resolvedAnswerQueue) {
    let anyCorrect = false;
    const correctAnswer = selectedQuestionObject["answer"];
    let savedCheckList = [];
    const sendPromisesPlayers = Array.from(resolvedAnswerQueue).map(({name, correct}) => {
        let wsobj = getHandleFromClientName(name);
        if(wsobj === undefined) return Promise.resolve();
        if(correct) {
            updateClientScore(wsobj, 10)
            clientAnswerCorrectList.set(name, true)
            anyCorrect = true;
        } else {
            clientAnswerCorrectList.set(name, false)
        }
        const tmpObj = {"name": name, "correct": correct, "correct_answer": correctAnswer};
        savedCheckList.push(tmpObj);
        status.sendStatusCheckAnswer(wsobj, tmpObj);
        return Promise.resolve();
    })

    const sendPromisesAudiences = broadcastImpl((resolve, wsObject, playerName) => {
        if(isPlayerAudience(playerName) || isHost(wsObject)) {
            for(let tmpObj of savedCheckList) {
                status.sendStatusCheckAnswer(wsObject, tmpObj);
            }
        }
        resolve();
    })

    questionCounter++;
    gameState.push({"index": currentPieceIndex, "correct": anyCorrect});
    
    await Promise.all([sendPromisesPlayers, sendPromisesAudiences]);
}

async function choosePiece(piece_index) {
    clientAnswerCorrectList.clear();
    currentPieceIndex = piece_index;
    let givenIndex = getRandomIndex(questionsList);
    selectedQuestionObject = { ...questionsList[givenIndex] };
    questionsList.splice(givenIndex, 1);
    let questionObject = await prepareClientQuestion(selectedQuestionObject, piece_index);
    let hostQuestionObject = prepareHostQuestion(selectedQuestionObject, piece_index);
    logging(loggingFilename, `Answer hint: ${selectedQuestionObject["answer"]}`);
    await broadcastQuestion(questionObject);
    await status.sendStatusHostQuestionLoad(hostHandle, hostQuestionObject);
    gameStateFlag.qload = true;
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
    if(gameStateFlag.startGame) {
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
        gameStateFlag.startGame = true;
        permitKeywordAnswer = true;
        await prepareKeyImage(keywordsList[getRandomIndex(keywordsList)]);
        logging(loggingFilename, `Selected keyword: ${selectedKeywordObject["keyword"]}`)
        status.sendStatusNotify(hostHandle, `Selected keyword: ${selectedKeywordObject["keyword"]}`);
        randomShuffleArray(selectedKeywordObject["clues"]);
        await broadcastKeywordProperties(selectedKeywordObject);
        await status.sendStatusHostKeyImage(hostHandle, selectedKeywordObject);
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
    server.listen(port, () => {
        serverRoomId = getRandomRoomId(4);
        logging(loggingFilename, `WebSocket server listening on port ${port}`);
        logging(loggingFilename, `Conenct with room ID ${serverRoomId}`);
    });
    await initGame();
    await waitingRoom();
}

main();
