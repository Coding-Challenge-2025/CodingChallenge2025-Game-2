import nodefs from 'node:fs/promises';
import nodepath from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export async function waitForAnyKey(msg) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    try {
        await rl.question(msg);
    } finally {
        rl.close();
    }
}

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

export async function imageFileToBase64(filePath) {
    try {
        const fileBuffer = await nodefs.readFile(filePath);
        const base64String = fileBuffer.toString('base64');
        let mimeType;
        const ext = nodepath.extname(filePath).toLowerCase();
        switch (ext) {
            case '.jpg':
            case '.jpeg':
                mimeType = 'image/jpeg';
                break;
            case '.png':
                mimeType = 'image/png';
                break;
            case '.gif':
                mimeType = 'image/gif';
                break;
            case '.webp':
                mimeType = 'image/webp';
                break;
            default:
                mimeType = 'application/octet-stream';
        }
        return `data:${mimeType};base64,${base64String}`;
    } catch(error) {
        console.error('Error converting image file to base64:', error);
        return null;
    }
}