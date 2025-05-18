import { program } from 'commander'  

program
    .option('--qrandom', "Enable random question")
    .option('--qfile <file_or_url>', "Question file location. Default is assets/questions.json")
    .option(`-l --load <file_or_url>`, "Load game state")

program.parse(process.argv);