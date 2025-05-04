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
    await sendStatus(wsObject, STATUS_DENIED, "Room is full");
}

export async function sendStatusInvalidID(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, "Invalid room ID");
}

export async function sendStatusDuplicateName(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, "Name already existed");
}

export async function sendStatusGameAlreadyRunning(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, "Game already running!");
}

export async function sendStatusWaitingForEvent(wsObject) {
    await sendStatus(wsObject, STATUS_NOTIFY, "Waiting for event...");
}

export async function sendStatusGameStart(wsObject) {
    await sendStatus(wsObject, STATUS_GAMESTART, "Starting game...");
}

export async function sendStatusGameEnd(wsObject) {
    await sendStatus(wsObject, STATUS_GAMEEND, JSON.stringify(getLeaderboard()));
}

export async function sendStatusPlayerLose(wsObject) {
    await sendStatus(wsObject, STATUS_PLAYERELOSE);
}

export async function sendStatusPlayerWin(wsObject) {
    await sendStatus(wsObject, STATUS_PLAYERWIN);
}

export async function sendStatusKeyImage(wsObject, keyImageObject) {
    await sendStatus(wsObject, STATUS_KEYIMAGE, JSON.stringify(keyImageObject));
}

export async function sendStatusLoadQuestion(wsObject, questionObject) {
    await sendStatus(wsObject, STATUS_QUESTIONLOAD, JSON.stringify(questionObject));
}

export async function sendStatusRunQuestion(wsObject) {
    await sendStatus(wsObject, STATUS_QUESTIONRUN);
}

export async function sendStatusCheckAnswer(wsObject, checkObject) {
    await sendStatus(wsObject, STATUS_CHECKANSWER, JSON.stringify(checkObject));
}

export async function sendStatusCheckKeyword(wsObject, checkObject) {
    await sendStatus(wsObject, STATUS_CHECKKEYWORD, JSON.stringify(checkObject));
}

export async function sendStatusClue(wsObject, clueObject) {
    await sendStatus(wsObject, STATUS_CLUE, JSON.stringify(clueObject));
}

export async function sendStatusLeaderboard(wsObject, leaderboardObject) {
    await sendStatus(wsObject, STATUS_LEADERBOARD, JSON.stringify(leaderboardObject));
}

export async function sendStatusRoundScore(wsObject, roundScoreObject) {
    await sendStatus(wsObject, STATUS_ROUNDSCORE, JSON.stringify(roundScoreObject));
}