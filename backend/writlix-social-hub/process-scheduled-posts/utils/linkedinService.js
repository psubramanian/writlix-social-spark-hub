const axios = require('axios');

/**
 * Posts content to LinkedIn.
 * @param {string} authorUrn - The URN of the author (e.g., 'urn:li:person:xxxx').
 * @param {string} textContent - The text content to post.
 * @param {string} accessToken - The OAuth2 access token for LinkedIn.
 * @returns {Promise<{success: boolean, postId?: string, error?: any}>}
 */
async function postToLinkedIn(authorUrn, textContent, accessToken) {
    console.log(`postToLinkedIn: Author URN: ${authorUrn}, Content: ${textContent ? textContent.substring(0,50) + '...' : 'undefined'}`);
    const LINKEDIN_API_URL = 'https://api.linkedin.com/v2/ugcPosts';
    try {
        const response = await axios.post(LINKEDIN_API_URL, {
            author: authorUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: textContent
                    },
                    shareMediaCategory: 'NONE'
                }
            },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        console.log('LinkedIn post successful:', response.data);
        return { success: true, postId: response.data.id };
    } catch (error) {
        console.error('Error posting to LinkedIn:', error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

module.exports = { postToLinkedIn };
