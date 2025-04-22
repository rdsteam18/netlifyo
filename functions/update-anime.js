const { Octokit } = require("@octokit/rest");

exports.handler = async function(event) {
    const { action, anime, animeId, episode } = JSON.parse(event.body);
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    try {
        const repo = { owner: 'rdsteam18', repo: 'netlifyo', path: 'data/anime.json' };
        const { data } = await octokit.repos.getContent(repo);
        const content = Buffer.from(data.content, 'base64').toString();
        const json = JSON.parse(content);

        if (action === 'add') {
            json.series.push(anime);
        } else if (action === 'update') {
            const index = json.series.findIndex(s => s.id === anime.id);
            if (index !== -1) {
                json.series[index] = anime;
            } else {
                throw new Error('Anime not found');
            }
        } else if (action === 'addEpisode') {
            const animeIndex = json.series.findIndex(s => s.id === animeId);
            if (animeIndex !== -1) {
                json.series[animeIndex].episodes.push(episode);
            } else {
                throw new Error('Anime not found');
            }
        }

        await octokit.repos.createOrUpdateFileContents({
            ...repo,
            message: `Update anime.json (${action})`,
            content: Buffer.from(JSON.stringify(json, null, 2)).toString('base64'),
            sha: data.sha
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Anime updated' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
