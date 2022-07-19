const core = require("@actions/core");
const { Octokit } = require("octokit");

module.exports = async () => {
  try {
    const filename = core.getInput("filename");
    const gitHubToken = core.getInput("github-token");
    const hostRepoName = core.getInput("host-repo-name");
    const hostRepoOwner = core.getInput("host-repo-owner");
    const remoteKey = core.getInput("remote-key");
    const remoteVersion = core.getInput("remote-version");

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

    core.debug("Decode File");
    core.debug(JSON.stringify(decodedFile));

    const updatedManifest = {
      ...JSON.parse(decodedFile),
      [remoteKey]: remoteVersion,
    };
    const encodedManifest = Buffer.from(
      JSON.stringify(updatedManifest)
    ).toString("base64");

    const updateRes = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner: hostRepoOwner,
        repo: hostRepoName,
        path: filename,
        message: `chore: update ${remoteKey} version`,
        committer: {
          name: "github_actions",
          email: "octocat@github.com",
        },
        content: encodedManifest,
      }
    );

    core.debug("GitHub API PUT response");
    core.debug(JSON.stringify(updateRes));
  } catch (error) {
    core.setFailed(error.message);
  }
};
