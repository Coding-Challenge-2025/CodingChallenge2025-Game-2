import nodefs from 'node:fs/promises';
import nodepath from 'node:path';
import https from 'node:https';
import http from 'node:http';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import {loggingFilename} from "./app.js"

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

export function fixClientTimepoint(timePointObject) {
    if(!Number.isInteger(timePointObject["client_start"]) || timePointObject["client_start"] < timePointObject["server_start"]) {
        timePointObject["client_start"] = timePointObject["server_start"]
    }
    if(!Number.isInteger(timePointObject["client_end"]) || timePointObject["client_end"] > timePointObject["server_end"]) {
        timePointObject["client_end"] = timePointObject["server_end"]
    }
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

export async function fetchFile(str) {
    let type = 0;   //1 if url, 2 is path

    try {
        new URL(str);
        type = 1;
    } catch (error) {
        if (str.includes('/') || str.includes('\\') || !str.includes('.')) {
            type = 2;
        }
    }
    if(type == 1) {
        if(str.startsWith('file://')) {
            str = fileURLToPath(str);
            type = 2;
        } else if(!(str.startsWith('http://') || str.startsWith('https://'))) {
            type = 2;
        }
    }

    if(type == 1) {
        try {
            await new Promise((resolve, reject) => {
                protocol.get(url, (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        logging(loggingFilename, `fetchFile url: success status ${res.statusCode}`);
                        resolve(1);
                    } else {
                        loggingError(loggingFilename, `fetchFile url: error status ${res.statusCode}`);
                        reject(-1);
                    }
                    res.resume();
                }).on('error', (err) => {
                    reject(-1);
                });
            });
            return 1;
        } catch (error) {
            loggingError(loggingFilename, `fetchFile url: ${error}`);
            return -1;
        }
    } else if(type == 2) {
        try {
            const data = await nodefs.readFile(str, { encoding: 'utf8' });
            logging(loggingFilename, `fetchFile file: success`);
            return 2;
        } catch(err) {
            loggingError(loggingFilename, `fetchFile file: error ${err}`);
            return -2;
        }
    } else return 0;
}