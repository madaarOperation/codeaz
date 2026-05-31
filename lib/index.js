// =================================================== #
// Project: Codeaz
// =================================================== #
import * as core from "@actions/core";
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
        core.setOutput("time", new Date().toTimeString());
    }
    catch (error) {
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
run();
//# sourceMappingURL=index.js.map