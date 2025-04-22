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

    const { action, anime, animeId, episode } = data;
    if (!action) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Action is required' })
        };
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    try {
        const repo = { owner: 'rdsteam18', repo: 'netlifyo', path: 'data/anime.json' };
        const { data: contentData } = await octokit.repos.getContent(repo);
        const content = Buffer.from(contentData.content, 'base64').toString();
        const json = JSON.parse(content);

        if (action === 'add') {
            if (!anime) throw new Error('Anime data is required');
            json.series.push(anime);
        } else if (action === 'update') {
            if (!anime) throw new Error('Anime data is required');
            const index = json.series.findIndex(s => s.id === anime.id);
            if (index !== -1) {
                json.series[index] = anime;
            } else {
                throw new Error('Anime not found');
            }
        } else if (action === 'addEpisode') {
            if (!animeId || !episode) throw new Error('Anime ID and episode data are required');
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
            sha: contentData.sha
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Anime updated' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
