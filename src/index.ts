// =================================================== #
// Project: Codeaz
// =================================================== #
import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const codeOwner = core.getInput("code-owner");
    console.log(`Hello ${codeOwner}`);
    core.setOutput("time", new Date().toTimeString());
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
