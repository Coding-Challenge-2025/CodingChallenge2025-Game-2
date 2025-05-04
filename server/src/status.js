//Server send these
export const STATUS_ACCEPT = "ACCEPT";
export const STATUS_DENIED = "DENIED";
export const STATUS_NOTIFY = "NOTIFY";
export const STATUS_GAMESTART = "START";
export const STATUS_GAMEEND = "END";
export const STATUS_PLAYERELOSE = "LOSE";
export const STATUS_PLAYERWIN = "WIN";
export const STATUS_KEYIMAGE = "KEYIMG";
export const STATUS_QUESTIONLOAD = "QLOAD";
export const STATUS_QUESTIONRUN = "QRUN";
export const STATUS_CLUE = "CLUE"; 
export const STATUS_CHECKANSWER = "ANSCHECK"
export const STATUS_CHECKKEYWORD = "KEYCHECK"
export const STATUS_ROUNDSCORE = "ROUNDSCORE"
export const STATUS_LEADERBOARD = "LEADERBOARD"

//Client send these
//Send {name: string, id: string, score: integer}
export const STATUS_LOGIN = "LOGIN"
//Send {answer: string}
export const STATUS_ANSWER = "ANSWER"
//Send {keyword: string}
export const STATUS_KEYWORD = "KEYWORD"

async function sendStatus(wsObject, statusCode, statusMessage = undefined) {
    if(wsObject.readyState == WebSocket.OPEN) {
        await wsObject.send(JSON.stringify({"status": statusCode, "message": statusMessage}));
    }
}

export async function sendStatusAccepted(wsObject) {
    await sendStatus(wsObject, STATUS_ACCEPT);
}

export async function sendStatusRoomIsFull(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason:": "Room is full"});
}

export async function sendStatusInvalidID(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason:": "Invalid room ID"});
}

export async function sendStatusDuplicateName(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason:": "Name already existed"});
}

export async function sendStatusGameAlreadyRunning(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason:": "Game already running!"});
}

export async function sendStatusWaitingForEvent(wsObject) {
    await sendStatus(wsObject, STATUS_NOTIFY, {"message:": "Waiting for event..."});
}

export async function sendStatusGameStart(wsObject) {
    await sendStatus(wsObject, STATUS_GAMESTART);
}

export async function sendStatusGameEnd(wsObject) {
    await sendStatus(wsObject, STATUS_GAMEEND);
}

export async function sendStatusPlayerLose(wsObject) {
    await sendStatus(wsObject, STATUS_PLAYERELOSE);
}

export async function sendStatusPlayerWin(wsObject) {
    await sendStatus(wsObject, STATUS_PLAYERWIN);
}

//{keyword_length: int, image: base64string}
export async function sendStatusKeyImage(wsObject, keyImageObject) {
    await sendStatus(wsObject, STATUS_KEYIMAGE, keyImageObject);
}

//{question: string, piece_index: int}
export async function sendStatusLoadQuestion(wsObject, questionObject) {
    await sendStatus(wsObject, STATUS_QUESTIONLOAD, questionObject);
}

export async function sendStatusRunQuestion(wsObject) {
    await sendStatus(wsObject, STATUS_QUESTIONRUN);
}

//{is_correct: 0 or 1, correct_answer: string}
export async function sendStatusCheckAnswer(wsObject, checkObject) {
    await sendStatus(wsObject, STATUS_CHECKANSWER, checkObject);
}

//{is_correct: 0 or 1}
export async function sendStatusCheckKeyword(wsObject, checkObject) {
    await sendStatus(wsObject, STATUS_CHECKKEYWORD, checkObject);
}

//{clue: string}
export async function sendStatusClue(wsObject, clueObject) {
    await sendStatus(wsObject, STATUS_CLUE, clueObject);
}

//array of {name: string, score: int}
export async function sendStatusLeaderboard(wsObject, leaderboardObject) {
    await sendStatus(wsObject, STATUS_LEADERBOARD, leaderboardObject);
}

//array of {epoch: float, name: string, answer: string, point: int}
export async function sendStatusRoundScore(wsObject, roundScoreObject) {
    await sendStatus(wsObject, STATUS_ROUNDSCORE, roundScoreObject);
}