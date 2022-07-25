const core = require("@actions/core");
const { Octokit } = require("octokit");

module.exports = async () => {
  try {
    const branch = core.getInput("branch");
    const filename = core.getInput("filename");
    const gitHubToken = core.getInput("github-token");
    const hostRepoName = core.getInput("host-repo-name");
    const hostRepoOwner = core.getInput("host-repo-owner");
    const remoteKey = core.getInput("remote-key");
    const remoteVersion = core.getInput("remote-version");

    core.debug(`remoteVersion: ${remoteVersion}`);

    const octokit = new Octokit({ auth: gitHubToken });

    const res = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: hostRepoOwner,
        repo: hostRepoName,
        path: filename,
      }
    );

    const decodedFile = Buffer.from(res.data.content, "base64").toString();

    core.debug("Decoded file");
    core.debug(JSON.stringify(decodedFile));

    const updatedManifest = {
      ...JSON.parse(decodedFile),
      [remoteKey]: remoteVersion,
    };
    core.debug("Updated manifest");
    core.debug(JSON.stringify(updatedManifest));

    const encodedManifest = Buffer.from(
      JSON.stringify(updatedManifest)
    ).toString("base64");

    const updateRes = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        branch: branch || undefined,
        content: encodedManifest,
        message: `chore: update ${remoteKey} version`,
        owner: hostRepoOwner,
        path: filename,
        repo: hostRepoName,
        sha: res.data.sha,
      }
    );

    core.debug("GitHub API PUT response");
    core.debug(JSON.stringify(updateRes));
  } catch (error) {
    core.setFailed(error.message);
  }
};
