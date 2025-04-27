export function getRandomRoomId(len) {
    const charlist = 'ABCDEF0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
        result += charlist.charAt(Math.floor(Math.random() * charlist.length));
    }
    return result;
}

export function getRandomIndex(arr) {
    if (!arr || arr.length === 0) {
        return undefined; // Handle empty or non-array input
    }
    const randomIndex = Math.floor(Math.random() * arr.length);
    return randomIndex;
}

export function randomShuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

export function checkClientTimepoint(clientTimepoint, serverTimepoint) {
    if(Number.isInteger(clientTimepoint)) {
        const diff = clientTimepoint - serverTimepoint;
        if(0 < diff && diff < ANSWER_TIMEOUT*1000) return true;
    }
    return false;
}