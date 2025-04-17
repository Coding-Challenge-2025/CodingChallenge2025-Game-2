import fs from 'fs';

//TODO FIX: asynchronousity messing up reading file 

//type: json object
export let questionsList = []
//type: json object
export let keywordsList = []

//return false if failure, true if success
export async function loadQuestionsList(jsonFilename) {
    return new Promise((resolve) => {
        fs.readFile(jsonFilename, "utf8", (fileerr, data) => {
            if(fileerr) {
                console.error("Error reading file:", fileerr.message);
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
export async function loadKeywordsList(jsonFilename) {
    return new Promise((resolve) => {
        fs.readFile(jsonFilename, "utf8", (fileerr, data) => {
            if(fileerr) {
                console.error("Error reading file:", fileerr.message);
                resolve(false);
            } else {
                keywordsList.length = 0;
                let jsonData;
                try {
                    jsonData = JSON.parse(data);
                } catch(jsonerror) {
                    console.error("Error parsing JSON:", jsonerror.message);
                    resolve(undefined);
                }
    
                if (jsonData && jsonData["keywords"]) {
                    // keywordsList = jsonData["keywords"];
                    resolve(jsonData["keywords"]);
                } else {
                    console.error("problemset.js -> loadKeywordsList: JSON does not contain 'keywords' array.");
                    resolve(undefined);
                }
            }
        })
    }).then((data) => keywordsList = data);
}

// async function main() {
//     await loadKeywordsList("../assets/keywords.json");
//     console.log(keywordsList)
// }

// main();