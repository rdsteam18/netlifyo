const { Octokit } = require("@octokit/rest");

exports.handler = async function(event) {
    console.log('Event received:', event);

    // Check if body exists and is a string
    const body = event.body ? (typeof event.body === 'string' ? event.body : JSON.stringify(event.body)) : '{}';
    console.log('Parsed body:', body);

    let data;
    try {
        data = JSON.parse(body);
    } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON input' })
        };
    }

    const { index } = data;
    if (index === undefined) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Index is required' })
        };
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    try {
        const repo = { owner: 'rdsteam18', repo: 'netlifyo', path: 'data/comments.json' };
        const { data: contentData } = await octokit.repos.getContent(repo);
        const content = Buffer.from(contentData.content, 'base64').toString();
        const json = JSON.parse(content);

        json.comments.splice(index, 1);

        await octokit.repos.createOrUpdateFileContents({
            ...repo,
            message: 'Delete comment',
            content: Buffer.from(JSON.stringify(json, null, 2)).toString('base64'),
            sha: contentData.sha
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Comment deleted' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
