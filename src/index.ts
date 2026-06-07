// =================================================== #
// Project: Codeaz
// =================================================== #
import * as core from "@actions/core";
import * as github from "@actions/github";
import { execSync } from "child_process";
const { context } = github;
declare const process: { env: { [key: string]: string | undefined } };

// INFO: Generate A Code Owners And It's Rule Key
const parseCodeOwner = (
  input: string | undefined,
): Record<string, string[]> => {
  const codeOwners: Record<string, string[]> = {};
  if (!input || input.trim() === "") {
    return codeOwners;
  }

  const items = input.split(";");

  for (const item of items) {
    const cleanItem = item.trim();
    if (!cleanItem) continue;
    const sparaterIndex = cleanItem.indexOf("=");
    if (sparaterIndex === -1) continue;
    const key = cleanItem.substring(0, sparaterIndex).trim().toLowerCase();
    const value = cleanItem.substring(sparaterIndex + 1).trim();

    codeOwners[key] = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return codeOwners;
};

// INFO: EntryPoint Function
async function run() {
  try {
    const codeOwner = parseCodeOwner(core.getInput("code-owner"));
    const username = context.actor;
    if (!username) {
      core.setFailed("Could not resolve the actor name.");
      return;
    }
    core.info(`Successfully extracted runner name: ${username}`);

    // Check Action Runner Permission
    const devMembers = codeOwner["dev"] || [];
    const opsMembers = codeOwner["ops"] || [];
    const isDevMember = devMembers.some(
      (member) => member.toLowerCase() === username.toLowerCase(),
    );
    const isOpsMember = opsMembers.some(
      (member) => member.toLowerCase() === username.toLowerCase(),
    );
    const branchName = context.ref.replace("refs/heads/", "");

    if (isDevMember || isOpsMember) {
      core.info(`Access Granted: ${username} is a member of our development team at ${branchName}`);
    } else {
      core.warning(`Access Denied: ${username} is NOT in our development team at ${branchName}`);
      core.info(`Resetting Branch '${branchName}' changes...`);
     //#INFO RESET COMMITS BLOCK
      let branch = "";
      let lastCommit = "";

      if (context.eventName === "pull_request") {
        const pr = context.payload.pull_request;
        if (!pr?.merged) return;
        branch = pr.base.ref;
        lastCommit = "HEAD~1";
      } else if (context.eventName === "push") {
        branch = context.ref.replace("refs/heads/", "");
        lastCommit = context.payload.before;
      } else if (context.eventName === "workflow_dispatch") {
        branch = context.ref.replace("refs/heads/", "");
        lastCommit = "HEAD~1";
      }

   
      const token = core.getInput("github-token") || core.getInput("token") || process.env.GITHUB_TOKEN;
      if (!token) {
        throw new Error("Authentication failed: No valid token provided.");
      }

      const { owner, repo } = context.repo;

      //#INFO Authenticate Git 
      execSync('git config --global user.email "github-actions[bot]@users.noreply.github.com"');
      execSync('git config --global user.name "github-actions[bot]"');

      // #INFO: Hard reset 
      execSync(`git reset --hard ${lastCommit}`);
      
      // #INFO: Clean cached For push credentials to prevent authentication issues
      try {
        execSync('git config --local --unset-all http.https://github.com/.extraheader || true', { stdio: 'ignore' });
      } catch {}

      //INFO:: 5. Force push 
      const secureUrl = `https://${token}@github.com/${owner}/${repo}.git`;
      execSync(`git push "${secureUrl}" HEAD:${branch} --force`);
      
      core.warning(`Security Action: History reset for ${username} is unauthorized`);
      core.setOutput("status", "reset");
      return;
    }

    // Set Output Values
    core.setOutput("runner_name", username);
    core.setOutput("status", "authorized");
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
