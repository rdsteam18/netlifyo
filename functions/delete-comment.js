const { Octokit } = require("@octokit/rest");

exports.handler = async function(event) {
    const { index } = JSON.parse(event.body);
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    try {
        const repo = { owner: 'rdsteam18', repo: 'netlifyo', path: 'data/comments.json' };
        const { data } = await octokit.repos.getContent(repo);
        const content = Buffer.from(data.content, 'base64').toString();
        const json = JSON.parse(content);

        json.comments.splice(index, 1);

        await octokit.repos.createOrUpdateFileContents({
            ...repo,
            message: 'Delete comment',
            content: Buffer.from(JSON.stringify(json, null, 2)).toString('base64'),
            sha: data.sha
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Comment deleted' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
