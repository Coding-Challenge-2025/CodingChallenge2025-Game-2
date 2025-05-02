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

//filename-friendly iso8601 timestamp
export function getLocalTimeISO8601() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    const offsetMinutes = now.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetRemainderMinutes = Math.abs(offsetMinutes % 60);
    const offsetSign = offsetMinutes < 0 ? '+' : '-';
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}${String(offsetRemainderMinutes).padStart(2, '0')}`;
    
    return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}.${milliseconds}${offsetString}`;
}

const LOGGING_CATEGORY = {
    INFO: "INFO",
    ERROR: "ERROR",
}

function formatLogging(loggingCategory, ...args) {
    const timestamp = getLocalTimeISO8601();
    let fullMessage = `${timestamp} - [${loggingCategory}] ${args.join(' ')}`;
    return fullMessage;
}

//return true if created, false otherwise
async function createDirectory(directoryPath) {
    try {
        await nodefs.access(directoryPath);
        return false; // Directory exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            await nodefs.mkdir(directoryPath, { recursive: true });
            return true;
        }
        throw error;
    }
}

export async function startLogging() {
    const logFileRoot = process.cwd() + "/log/";
    try {
        await createDirectory(logFileRoot);
    } catch(error) {
        console.error(formatLogging(LOGGING_CATEGORY.ERROR, "Couldn't create directory", error))
        return undefined;
    }

    const timestamp = getLocalTimeISO8601();
    let filename = nodepath.resolve(logFileRoot, timestamp + ".log");
    nodefs.writeFile(filename, formatLogging(LOGGING_CATEGORY.INFO, "Logging initialized") + "\n", 'utf8').catch(e => {
        console.error(formatLogging(LOGGING_CATEGORY.ERROR, "startLogging() error:", e))
    });
    return filename;
}

export async function logging(filename, ...args) {
    let fullMessage = formatLogging(LOGGING_CATEGORY.INFO, args)
    console.log(fullMessage);
    if(filename) {
        try {
            await nodefs.appendFile(filename, fullMessage + '\n', 'utf8');
        } catch (e) {
            console.error(formatLogging(LOGGING_CATEGORY.ERROR, "logging() error: ", e));
        }
    } else {
        console.error(formatLogging(LOGGING_CATEGORY.ERROR, "logging() error: file not found"));
    }
}

export async function loggingError(filename, ...args) {
    let fullMessage = formatLogging(LOGGING_CATEGORY.ERROR, args)
    console.error(fullMessage);
    if(filename) {
        try {
            await nodefs.appendFile(filename, fullMessage + '\n', 'utf8');
        } catch (e) {
            console.error(formatLogging(LOGGING_CATEGORY.ERROR, "loggingError() error: ", e));
        }
    } else {
        console.error(formatLogging(LOGGING_CATEGORY.ERROR, "loggingError() error: file not found"));
    }
}