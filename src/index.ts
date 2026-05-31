// =================================================== #
// Project: Codeaz
// =================================================== #
import * as core from "@actions/core";
import * as github from "@actions/github";

// INFO: Generate A Code Owners And It's Rule Key
const parseCodeOwner = (input: string | undefined): Record<string, string> => {
  const codeOwners: Record<string, string> = {};
  if (!input || input.trim() === "") {
    return codeOwners;
  }

  const items = input.split(",");
  for (const item of items) {
    const cleanItem = item.trim();
    if (!cleanItem) continue;
    const sparaterIndex = cleanItem.indexOf("=");
    if (sparaterIndex === -1) continue;
    const key = cleanItem.substring(0, sparaterIndex).trim().toLowerCase(); // always use lower keys
    const value = cleanItem.substring(sparaterIndex + 1).trim();
    if (key) codeOwners[key] = value;
  }

  return codeOwners;
};
async function run() {
  try {
    const codeOwner = parseCodeOwner(core.getInput("code-owner"));
    const recordLength = Object.keys(codeOwner).length;
    core.info(`Hello ${JSON.stringify(codeOwner)} ${recordLength}`);
    core.setOutput("time", new Date().toTimeString());
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
run();
