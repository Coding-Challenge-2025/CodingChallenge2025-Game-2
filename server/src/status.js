//Send {name: string, id: string, score: integer}
export const STATUS_LOGIN = "LOGIN"
export const STATUS_ACCEPT = "ACCEPT";
export const STATUS_DENIED = "DENIED";
export const STATUS_NOTIFY = "NOTIFY";
//Server send these to Player & Audience
export const STATUS_GAMESTART = "START";
export const STATUS_GAMEEND = "END";
export const STATUS_PLAYERELOSE = "LOSE";
export const STATUS_PLAYERWIN = "WIN";
export const STATUS_KEYIMAGE = "KEYIMG";
export const STATUS_QUESTIONLOAD = "QLOAD";
export const STATUS_QUESTIONRUN = "QRUN";
export const STATUS_CLUE = "CLUE"; 
export const STATUS_CHECKANSWER = "ANSCHECK"
// export const STATUS_CHECKKEYWORD = "KEYCHECK"
export const STATUS_ROUNDSCORE = "ROUNDSCORE"
export const STATUS_LEADERBOARD = "LEADERBOARD"

//Send {name: string, keyword: string}
export const STATUS_NOTIFYKEYWORD = "KEYNOTIFY"
//Send {name: string, keyword: string}
export const STATUS_SHOWKEYWORD = "KEYSHOW"
//Send {name: string, keyword: string, correct: bool}
export const STATUS_KEYWORDRESOLVE = "KEYRESOLVE"

//Server send these to Host UI 
//Notify the host with a string message
export const STATUS_HOSTNOTIFY = "HOSTNOTIFY"
//Load question for host. Send {question: string, answer: string, piece_index: int}
export const STATUS_HOSTQUESTIONLOAD = "HOSTQLOAD"
//Send {image: base64string, keyword: string}
export const STATUS_HOSTKEYIMAGE = "HOSTKEYIMG"
//Send {name: string, keyword: string}
//time's up
export const STATUS_HOSTNOTIFYTIMESUP = "TIMESUP"
//Send {audiences: array of string, players: array of string}
export const STATUS_HOSTGIVECLIENTS = "CLIENTSLIST"
//Send array of {name: string, answer: string, epoch: float}
export const STATUS_HOSTANSWERQUEUE = "ANSQUEUE"
//Server also send STATUS_CLUE, STATUS_ROUNDSCORE, STATUS_LEADERBOARD

//Player send these

//Send {answer: string}
export const STATUS_ANSWER = "ANSWER"
//Send {keyword: string}
export const STATUS_KEYWORD = "KEYWORD"

//Audience
//Send {name: string, id: string}
export const STATUS_AUDIENCELOGIN = "AALOGIN"

//Host UI send these
//Send {id: string, password: string}
export const STATUS_HOSTLOGIN = "HLOGIN"
//Host send to start/end game
export const STATUS_HOSTGAMESTART = "HOSTGS"
export const STATUS_HOSTGAMEEND = "HOSTGE"
//Send {piece_index: int}   - piece_index start from 0
export const STATUS_CHOOSEPIECE = "CHOOSEPIECE"
//Host send to start question
export const STATUS_HOSTQUESTIONRUN = "HOSTQRUN"
//Send STATUS_SHOWKEYWORD {name: string, keyword: string}
//set the checked answer, broadcast to client correct/incorrect
export const STATUS_ANSWERRESOLVE = "ANSRESOLVE"
export const STATUS_GETROUNDSCORE = "GETROUNDSCORE"
export const STATUS_GETLEADERBOARD = "GETLEADERBOARD"
//Send {piece_index: int}. Signal to open clue
export const STATUS_OPENCLUE = "OCLUE"
//Send nothing. No clue open
export const STATUS_NOCLUE = "NCLUE"
//Send {name: string, score: int}
export const STATUS_SETSCORE = "SETSCORE"
//Send
export const STATUS_GETCLIENTS = "GETCLIENTS"
//Send array of {index: integer, correct: bool, clue: string}
// export const STATUS_LOADGAMESTATE = "LOADGAMESTATE"

async function sendStatus(wsObject, statusCode, statusMessage = undefined) {
    if(wsObject.readyState == WebSocket.OPEN) {
        await wsObject.send(JSON.stringify({"status": statusCode, "message": statusMessage}));
    }
}

export async function sendStatusAccepted(wsObject) {
    await sendStatus(wsObject, STATUS_ACCEPT);
}

export async function sendStatusRoomIsFull(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason": "Room is full"});
}

export async function sendStatusInvalidID(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason": "Invalid room ID"});
}

export async function sendStatusDuplicateName(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason": "Name already existed"});
}

export async function sendStatusGameAlreadyRunning(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason": "Game already running!"});
}

export async function sendStatusInvalidPassword(wsObject) {
    await sendStatus(wsObject, STATUS_DENIED, {"reason": "Invalid password"});
}

export async function sendStatusWaitingForEvent(wsObject) {
    // await sendStatus(wsObject, STATUS_NOTIFY, {"message": "Waiting for event..."});
}

export async function sendStatusNotify(wsObject, message) {
    await sendStatus(wsObject, STATUS_NOTIFY, {"message": message});
}

export async function sendStatusGameStart(wsObject) {
    await sendStatus(wsObject, STATUS_GAMESTART);
}

export async function sendStatusGameEnd(wsObject, finalKeywordObject) {
    const tmpdata = {"keyword": finalKeywordObject["keyword"], "clues": finalKeywordObject["clues"]}
    await sendStatus(wsObject, STATUS_GAMEEND, tmpdata);
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

//send {time: integer}
export async function sendStatusRunQuestion(wsObject, timeout) {
    await sendStatus(wsObject, STATUS_QUESTIONRUN, {"time": timeout});
}

//{name: string, correct: 0 or 1, correct_answer: string}
export async function sendStatusCheckAnswer(wsObject, checkObject) {
    await sendStatus(wsObject, STATUS_CHECKANSWER, checkObject);
}

//{name: string, keyword: string}
export async function sendStatusShowKeyword(wsObject, keywordObject) {
    await sendStatus(wsObject, STATUS_SHOWKEYWORD, keywordObject); 
}

export async function sendStatusCheckKeyword(wsObject, checkObject) {
    await sendStatus(wsObject, STATUS_KEYWORDRESOLVE, checkObject);
}

//{clue: string, piece_index: int}
export async function sendStatusClue(wsObject, clue, index) {
    await sendStatus(wsObject, STATUS_CLUE, {"clue": clue, "piece_index": index});
}

//array of {name: string, score: int}
export async function sendStatusLeaderboard(wsObject, leaderboardObject) {
    await sendStatus(wsObject, STATUS_LEADERBOARD, leaderboardObject);
}

//array of {epoch: float, name: string, answer: string, point: int}
export async function sendStatusRoundScore(wsObject, roundScoreObject) {
    await sendStatus(wsObject, STATUS_ROUNDSCORE, roundScoreObject);
}

export async function sendStatusHostQuestionLoad(wsObject, hostQuestionObject) {
    await sendStatus(wsObject, STATUS_HOSTQUESTIONLOAD, hostQuestionObject);
}

export async function sendStatusHostKeyImage(wsObject, hostkeyImageObject) {
    await sendStatus(wsObject, STATUS_HOSTKEYIMAGE, hostkeyImageObject);
}

export async function sendStatusNotifyKeyword(wsObject, keywordObject) {
    await sendStatus(wsObject, STATUS_NOTIFYKEYWORD, keywordObject);
}

export async function sendStatusHostNotifyTimesup(wsObject) {
    await sendStatus(wsObject, STATUS_HOSTNOTIFYTIMESUP);
}

export async function sendStatusHostAnswerQueue(wsObject, answerQueueObject) {
    await sendStatus(wsObject, STATUS_HOSTANSWERQUEUE, answerQueueObject);
}

export async function sendStatusHostClientsList(wsObject, convertedClientsListObject) {
    await sendStatus(wsObject, STATUS_HOSTGIVECLIENTS, convertedClientsListObject);
}

export async function sendStatusLoadGameState(wsObject, gameState) {
    // await sendStatus(wsObject, STATUS_LOADGAMESTATE, gameState);
    //send both for testing
    const sendGameStatePromise = gameState.map(({index, correct, clue}) => {
        return new Promise((promise) => {
            sendStatusClue(wsObject, clue, index);
            promise();
        })
    })
    Promise.all(sendGameStatePromise);
}