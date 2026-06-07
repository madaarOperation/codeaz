// =================================================== #
// Project: Codeaz
// =================================================== #
import * as core from "@actions/core";
import { context } from "@actions/github";
import { execSync } from "child_process";
// INFO: Generate A Code Owners And It's Rule Key
const parseCodeOwner = (input) => {
    const codeOwners = {};
    if (!input || input.trim() === "") {
        return codeOwners;
    }
    const items = input.split(";");
    for (const item of items) {
        const cleanItem = item.trim();
        if (!cleanItem)
            continue;
        const sparaterIndex = cleanItem.indexOf("=");
        if (sparaterIndex === -1)
            continue;
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
        const recordLength = Object.keys(codeOwner).length;
        core.info(`Hello ${JSON.stringify(codeOwner)} ${recordLength}`);
        // 1. Extract Action Maker and Action
        const username = context.actor;
        if (!username) {
            core.setFailed("Cloud not resolve the actor name.");
            return;
        }
        core.info(`Successfully extract runner name: ${username}`);
        // 2. Check Action Runner Permission
        const devMembers = codeOwner["dev"] || [];
        const opsMembers = codeOwner["ops"] || [];
        const isDevMember = devMembers.some((member) => member.toLowerCase() == username.toLowerCase());
        const isOpsMember = opsMembers.some((member) => member.toLowerCase() == username.toLowerCase());
        const branchName = context.ref.replace("refs/heads/", "");
        if (isDevMember || isOpsMember) {
            core.info(`Access Granted: ${username} is a member of our development team at ${branchName}`);
        }
        else {
            core.warning(`Access Denied: ${username} is NOT in our development team at ${branchName}`);
            core.info(`[DEBUG 1] Commencing reset flow initialization...`);
            // 1. Calculate event parameters
            let branch = "";
            let lastCommit = "";
            core.info(`[DEBUG 2] Current incoming event name is: "${context.eventName}"`);
            if (context.eventName === "pull_request") {
                const pr = context.payload.pull_request;
                if (!pr?.merged) {
                    core.info(`[DEBUG 3-PR] PR is not merged. Exiting early.`);
                    return;
                }
                branch = pr.base.ref;
                lastCommit = "HEAD~1";
            }
            else if (context.eventName === "push") {
                branch = context.ref.replace("refs/heads/", "");
                lastCommit = context.payload.before;
            }
            else if (context.eventName === "workflow_dispatch") {
                branch = context.ref.replace("refs/heads/", "");
                lastCommit = "HEAD~1";
            }
            core.info(`[DEBUG 4] Target branch resolved to: "${branch}"`);
            core.info(`[DEBUG 5] Target rollback commit resolved to: "${lastCommit}"`);
            // 2. Token Extraction Debugging
            core.info(`[DEBUG 6] Extracting authentication token inputs...`);
            const githubTokenInput = core.getInput("github-token");
            const legacyTokenInput = core.getInput("token");
            const token = githubTokenInput || legacyTokenInput || process.env.GITHUB_TOKEN;
            const tokenSource = githubTokenInput
                ? "github-token input"
                : legacyTokenInput
                    ? "token input"
                    : process.env.GITHUB_TOKEN
                        ? "GITHUB_TOKEN env"
                        : "none";
            if (!token) {
                core.info(`[DEBUG 6-ERROR] Token variable is empty or undefined!`);
                throw new Error("TOKEN NOT GIVEN");
            }
            core.info(`[DEBUG 7] Token verified successfully (Length: ${token.length} characters) (${tokenSource})`);
            const { owner, repo } = context.repo;
            core.info(`[DEBUG 8] Target repository tracking details: ${owner}/${repo}`);
            const isLikelyPAT = (value) => {
                return /^(ghp_|gho_|ghu_|ghr_|github_pat_)/.test(value);
            };
            // 2.5 Detect workflow file changes and warn if token may be insufficient
            try {
                const diffOutput = execSync(`git diff --name-only ${lastCommit} HEAD`, {
                    stdio: ["pipe", "pipe", "ignore"],
                }).toString("utf8");
                const changedFiles = diffOutput
                    .split("\n")
                    .map((path) => path.trim())
                    .filter(Boolean);
                const workflowFiles = changedFiles.filter((path) => path.startsWith(".github/workflows/"));
                if (workflowFiles.length > 0) {
                    core.info(`[DEBUG 6-WARN] Detected workflow file changes in the rollback range: ${workflowFiles.join(", ")}`);
                    if (!isLikelyPAT(token)) {
                        throw new Error("Workflow file changes detected. Your token does not appear to be a PAT with workflows permission. Provide a personal access token via github-token.");
                    }
                    core.info("Workflow files are included in the rollback range, and the provided token appears to be a PAT. Continuing with push.");
                }
            }
            catch (diffError) {
                core.info(`[DEBUG 6-NOTE] Unable to inspect changed files for workflow updates: ${diffError.message}`);
            }
            // 3. Git Configuration Commands Debugging
            core.info(`[DEBUG 9] Executing git config user.email...`);
            execSync('git config --global user.email "github-actions[bot]@users.noreply.github.com"');
            core.info(`[DEBUG 10] Executing git config user.name...`);
            execSync('git config --global user.name "github-actions[bot]"');
            // 4. Git Reset Command Debugging
            core.info(`[DEBUG 11] Preparing local git hard reset execution...`);
            try {
                execSync(`git reset --hard ${lastCommit}`);
                core.info(`[DEBUG 12] Local hard reset executed successfully!`);
            }
            catch (resetError) {
                core.info(`[DEBUG 11-CRITICAL_FAIL] Git reset command crashed! Error message: ${resetError.message}`);
                throw resetError;
            }
            // 5. Git Force Push Debugging
            const secururl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
            core.info(`[DEBUG 14] Executing remote force push command to GitHub...`);
            try {
                execSync(`git push ${secururl} HEAD:${branch} --force`);
                core.info(`[DEBUG 15] Remote force push completely successful! Changes wiped.`);
            }
            catch (pushError) {
                const stderr = pushError.stderr instanceof Buffer
                    ? pushError.stderr.toString("utf8")
                    : typeof pushError.stderr === "string"
                        ? pushError.stderr
                        : "";
                if (stderr.includes("without `workflows` permission")) {
                    core.error("GitHub rejected the push because the token does not have workflows permission.");
                    core.error("Use a personal access token with repo and workflows permissions, not the default GITHUB_TOKEN.");
                    throw new Error("Push failed: token lacks workflows permission for workflow file update.");
                }
                core.info(`[DEBUG 14-CRITICAL_FAIL] Git force push rejected or crashed! Error message: ${pushError.message}`);
                throw pushError;
            }
        }
        // 3. Set Output Values
        core.setOutput("time", new Date().toTimeString());
        core.setOutput("runner_name: ", username);
    }
    catch (error) {
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
run();
//# sourceMappingURL=index.js.map