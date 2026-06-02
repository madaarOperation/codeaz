// =================================================== #
// Project: Codeaz
// =================================================== #
import * as core from "@actions/core";
import { context } from "@actions/github";
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
            core.info(`Resetting Branch '${branchName}' Changes`);
            // TODO: Need To Reset User Work
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