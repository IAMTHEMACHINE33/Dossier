// Get the git oneline log of the day
// make it persist
import { exec } from "node:child_process";
import util from "node:util";
import { generateText } from "ai";
// Add key and working directory using arguments
// Take from file
const working_dir = [
  "/home/machine/work/ambitionguru/sociair/sociair-chat-app",
  "/home/machine/work/ambitionguru/sociair-channel-chat",
];

const execAsync = util.promisify(exec);

const logs = await Promise.all(
  working_dir.map(
    async (dir) =>
      await execAsync(
        `cd ${dir} && git log --oneline --since="yesterday" --all`,
      ),
  ),
);
console.log("logs", logs);
// prompt for ask for anything else
// notify - send;
// Hit GEMINI for the format and writing
/* const { text } = await generateText({
  model: "google/gemini-2.5-flash",
  prompt:
    "You are an daily update writer, I will give you my daily tasks and my git commits make short daily update for me.",
}); */
// Ask any change is needed
// Hit sociair api
