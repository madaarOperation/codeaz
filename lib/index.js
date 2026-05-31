// =================================================== #
// Project: Codeaz
// =================================================== #
import * as core from "@actions/core";
import * as exec from "@actions/exec";
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
        // const teamMembers = codeOwner["tm"] || [];
        // const isTeamMember = teamMembers.some(
        //   (member) => member.toLowerCase() == username.toLowerCase(),
        // );
        // const branchName = context.ref.replace("refs/heads/", "");
        //
        // if (isTeamMember) {
        //   core.info(
        //     `Access Granted: ${username} is a member of our development team at ${branchName}`,
        //   );
        // } else {
        //   core.warning(
        //     `Access Denied: ${username} is NOT in our development team at ${branchName}`,
        //   );
        //   core.info(`Resetting Branch '${branchName}' Changes`);
        //   try {
        //     let stdout = "";
        //     await exec.exec("git", ["rev-parse", "--verify", "HEAD^"], {
        //       listeners: { stdout: (data: Buffer) => (stdout += data.toString()) },
        //       ignoreReturnCode: true,
        //     });
        //     if (!stdout) {
        //       // No Parent Commit
        //       core.info(
        //         "No Parent Commit To Reset To; cleaning working tree instead.",
        //       );
        //       await exec.exec("git", ["clean", "-fd"]);
        //       await exec.exec("git", ["checkout", "--", "."]);
        //     } else {
        //       await exec.exec("git", ["reset", "--hard", "HEAD~1"]);
        //     }
        //     core.info("Reset Completed.");
        //   } catch (err: any) {
        //     core.setFailed(
        //       `Failed To Reset branch Changes: ${err?.message || String(err)}`,
        //     );
        //   }
        // }
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