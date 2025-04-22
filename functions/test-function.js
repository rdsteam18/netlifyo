exports.handler = async function(event, context) {
         return {
             statusCode: 200,
             body: JSON.stringify({
                 message: "Test function works!",
                 githubTokenSet: !!process.env.GITHUB_TOKEN,
                 event: event
             })
         };
     }
