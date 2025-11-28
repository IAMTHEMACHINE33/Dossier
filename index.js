import { exec } from "node:child_process";
import util from "node:util";
import fs from "node:fs/promises";
import https from "node:https";
import { GoogleGenAI } from "@google/genai";
import readline from "node:readline";

// Add key and working directory using arguments
// Take from file
// If doesn't exists make a env.json
const envhelpers = {
  readEnv: async () => {
    const oldRawData = await fs.readFile("./env.json");
    return JSON.parse(oldRawData);
  },
  writeEnv: async (newData) => {
    await fs.writeFile("./env.json", JSON.stringify(newData));
  },
  changeKey: async function (key) {
    const data = await this.readEnv();
    data.apiKey = key;
    await this.writeEnv(data);
  },
  addWorkingDirectory: async function (directory) {
    const data = await this.readEnv();
    data.workingDir.push(directory);
    await this.writeEnv(data);
  },
  addToken: async function (token) {
    const data = await this.readEnv();
    data.token = token;
    await this.writeEnv(data);
  },
};

const env = await envhelpers.readEnv();
const working_dir = env.workingDir;
const token = env.token;
const GEMINI_API_KEY = env.apiKey;

const execAsync = util.promisify(exec);
const getLogs = async () => {
  return await Promise.all(
    working_dir.map(
      async (dir) =>
        (
          await execAsync(
            `cd ${dir} && git log --oneline --since="yesterday" --all`,
          )
        ).stdout,
    ),
  );
};
const formatLog = async () => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const contents = `You are an daily update writer, I will give you my daily tasks and my git commits make short daily update for me.
    The daily update should be in this format
    Do not write any thing except from this format
    Have 3 points atleast, and not more than 4 points
    S.N. | Description Of Work Done | Status 

    The commits and the work list is here below
    {${logs}}
    `;
  console.log("contents", contents);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });
  console.log("response", response.candidates[0].content.parts[0].text);
  return response.candidates[0].content.parts[0].text;
};
const getAsync = (options) => {
  return new Promise((res, rej) => {
    https.get(options, (socket) => {
      let data = "";
      socket.on("data", (rawData) => {
        data += rawData;
      });
      socket.on("end", () => {
        res(data);
      });
    });
  });
};
// const getAsync = util.promisify(https.get);
const checkAddedLog = async () => {
  const date = "2025-11-18";

  return await getAsync({
    hostname: "central-api.sociair.com",
    path: `/api/v1/hr/dailyUpdates/has-daily-update?date=${date}`,
    agent: false,
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      authorization: token,
      origin: "https://sttn.sociair.com",
      priority: "u=1, i",
      referer: "https://sttn.sociair.com/",
      "sec-ch-ua":
        '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    },
  });
};

const printLogAndEdit = (logMessage) => {
  // Create the readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true, // Ensures that input is interactive
  });
  process.stdout.write(`Log message: ${logMessage}`);
  rl.input.on("keypress", (char, key) => {
    switch (key?.name) {
      case "return": {
        break;
      }
      case "backspace": {
        logMessage = logMessage.slice(0, -1);
        console.log("inside");
        console.clear();
        process.stdout.write("Edit the log press enter after finish\n");
        process.stdout.write(`Log message: ${logMessage}`);
        break;
      }
      default:
    }
  });
};

// hit api for added log for that day or not [done but doesn't work]
// Get Logs [done]
// Show the logs to user [done]
// Give a prompt so that they can add their logs [done]
printLogAndEdit("After editing the message press <Enter>");
// hit gemini for formatting [done]
// show the user the final format [done]
// hit the api
