import { exec } from "node:child_process";
import util from "node:util";
import fs from "node:fs/promises";
import { GoogleGenAI } from "@google/genai";

// Add key and working directory using arguments
// Take from file
// If doesn't exists make a env.json
const helpers = {
  readEnv: async () => {
    const oldRawData = await fs.readFile("./env.json");
    return JSON.parse(oldRawData);
  },
  writeEnv: async (newData) => {
    await fs.writeFile("./env.json", JSON.stringify(newData));
  },
  changeKey: async (key) => {
    const data = await readEnv();
    data.apiKey = key;
    await writeEnv(data);
  },
  addWorkingDirectory: async (directory) => {
    const data = await readEnv();
    data.workingDir.push(directory);
    await writeEnv(data);
  },
};

const env = await helpers.readEnv();
const working_dir = env.workingDir;
const GEMINI_API_KEY = env.apiKey;

const execAsync = util.promisify(exec);

const logs = await Promise.all(
  working_dir.map(
    async (dir) =>
      (
        await execAsync(
          `cd ${dir} && git log --oneline --since="yesterday" --all`,
        )
      ).stdout,
  ),
);
console.log("logs", logs);
// prompt for ask for anything else
// notify - send;
// Hit GEMINI for the format and writing

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
// Ask any change is needed
// Hit sociair api
