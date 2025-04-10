const fs = require('fs')
// import * as fs from "fs"
// import fs from 'node:fs'

const questionsList = []
const keywordsList = []

//return false if failure, true if success
async function loadQuestionsList(jsonFilename) {
    return new Promise((resolve) => {
        fs.readFile(jsonFilename, "utf8", (fileerr, data) => {
            if(fileerr) {
                console.error("Error reading file:", fileerr.message);
                returnStatus = false;
                resolve(false);
                return;
            } else {
                questionsList.length = 0;
                let jsonData;
                try {
                    jsonData = JSON.parse(data);
                } catch(jsonerror) {
                    console.error("Error parsing JSON:", jsonerror.message);
                    resolve(false);
                    return;
                }
    
                if (jsonData && jsonData["questions"]) {
                    questionsList = jsonData["questions"];
                    resolve(true);
                } else {
                    console.error("problemset.js -> loadQuestionsList: JSON does not contain 'questions' array.");
                    resolve(false);
                }
            }
        })
    })
}

//return false if failure, true if success
async function loadKeywordsList(jsonFilename) {
    return new Promise((resolve) => {
        fs.readFile(jsonFilename, "utf8", (fileerr, data) => {
            if(fileerr) {
                console.error("Error reading file:", fileerr.message);
                returnStatus = false;
                resolve(false);
                return;
            } else {
                keywordsList.length = 0;
                let jsonData;
                try {
                    jsonData = JSON.parse(data);
                } catch(jsonerror) {
                    console.error("Error parsing JSON:", jsonerror.message);
                    resolve(false);
                    return;
                }
    
                if (jsonData && jsonData["keywords"]) {
                    keywordsList = jsonData["keywords"];
                    resolve(true);
                } else {
                    console.error("problemset.js -> loadKeywordsList: JSON does not contain 'keywords' array.");
                    resolve(false);
                }
            }
        })
    })
}

module.exports = {
    loadQuestionsList: loadQuestionsList,
    loadKeywordsList: loadKeywordsList,
    questionsList: questionsList,
    keywordsList: keywordsList
};