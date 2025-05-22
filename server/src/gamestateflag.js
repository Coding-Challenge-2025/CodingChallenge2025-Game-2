export class GameStateFlag {
    startGame = false;
    qload = false;
    qrun = false;
    hostEverLogin = false;
    constructor() {}

    reset() {
        this.startGame = false;
        this.qload = false;
        this.qrun = false;
        this.hostEverLogin = false;
    }
}