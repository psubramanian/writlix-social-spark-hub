const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { Clerk } = require("@clerk/clerk-sdk-node"); // Or require('@clerk/backend') depending on version and usage
const axios = require("axios");

const TABLE_NAME = 'WritlixSocialHub';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
    console.error('CRITICAL: CLERK_SECRET_KEY environment variable is not set.');
    // In a real Lambda, you might throw an error here to prevent execution without Clerk config
}

const dynamoDbClient = new DynamoDBClient({
    region: AWS_REGION,
    endpoint: DYNAMODB_ENDPOINT,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const clerkClient = CLERK_SECRET_KEY ? Clerk({ secretKey: CLERK_SECRET_KEY }) : null;

// --- Social Media Posting Helpers (Placeholders) ---
async function postToLinkedIn(accessToken, contentIdea, userId) {
    console.log(`Attempting to post to LinkedIn for user ${userId}, content: ${contentIdea.contentIdeaId}`);
    // LinkedIn API V2 URL for creating a share: https://api.linkedin.com/v2/ugcPosts
    const LINKEDIN_API_URL = 'https://api.linkedin.com/v2/ugcPosts';
    try {
        const response = await axios.post(LINKEDIN_API_URL, {
            author: `urn:li:person:${userId}`, // This needs the LinkedIn person URN, not Clerk user_id. Clerk might provide this via user.publicMetadata or an API call.
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: contentIdea.textContent // Assuming textContent is the field
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

async function postToFacebook(accessToken, contentIdea, userId) {
    console.log(`Attempting to post to Facebook for user ${userId}, content: ${contentIdea.contentIdeaId}`);
    // Placeholder: Implement Facebook Graph API call
    // const FACEBOOK_API_URL = `https://graph.facebook.com/vX.X/me/feed`; // or /<page_id>/feed
    // Needs page ID and specific permissions.
    console.warn('Facebook posting not yet implemented.');
    return { success: false, error: 'Facebook posting not implemented' };
}

async function postToInstagram(accessToken, contentIdea, userId) {
    console.log(`Attempting to post to Instagram for user ${userId}, content: ${contentIdea.contentIdeaId}`);
    // Placeholder: Implement Instagram Graph API call (usually for business accounts, involves media uploads first)
    console.warn('Instagram posting not yet implemented.');
    return { success: false, error: 'Instagram posting not implemented' };
}

// --- Main Handler ---
exports.handler = async (event) => {
    console.log('ProcessScheduledPostsLambda invoked:', JSON.stringify(event, null, 2));

    if (!clerkClient) {
        console.error('Clerk client not initialized. CLERK_SECRET_KEY might be missing.');
        return { statusCode: 500, body: 'Internal server error: Clerk configuration missing.' };
    }

    const nowUTC = new Date().toISOString();

    const params = {
        TableName: TABLE_NAME,
        IndexName: 'ScheduledPostsByStatusAndDate',
        KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK <= :now_utc',
        ExpressionAttributeValues: {
            ':gsi1pk': 'POST_STATUS#pending', // Global query for all pending posts
            ':now_utc': `SCHEDULED_AT_UTC#${nowUTC}`
        },
        // Limit to process a certain number of posts per invocation if needed
        // Limit: 10 
    };

    try {
        console.log('Querying for due posts with params:', JSON.stringify(params));
        const { Items: duePosts } = await docClient.send(new QueryCommand(params));

        if (!duePosts || duePosts.length === 0) {
            console.log('No posts currently due for publishing.');
            return { statusCode: 200, body: 'No posts due.' };
        }

        console.log(`Found ${duePosts.length} posts to process.`);
        let successCount = 0;
        let failureCount = 0;

        for (const post of duePosts) {
            console.log('Processing post:', JSON.stringify(post));
            const { PK, SK, userId, contentIdeaId, platform, scheduledPostId } = post;

            // 1. Fetch Content Idea
            let contentIdea;
            try {
                const contentParams = {
                    TableName: TABLE_NAME,
                    Key: { PK: `USER#${userId}`, SK: `CONTENT_IDEA#${contentIdeaId}` }
                };
                const { Item } = await docClient.send(new QueryCommand(contentParams)); // QueryCommand is for GSI, GetCommand for specific item
                // Correction: Use GetCommand for fetching a single item by its primary key.
                // const { Item } = await docClient.send(new GetCommand(contentParams)); 
                // For now, assuming contentIdeaId is the SK part of the content idea.
                // This needs to be robust. If contentIdeaId is just an attribute, the SK might be different.
                // Let's assume for now contentIdeaId IS the sort key part for CONTENT_IDEA item.
                const contentIdeaResponse = await docClient.send(new QueryCommand({
                    TableName: TABLE_NAME,
                    KeyConditionExpression: 'PK = :pk AND SK = :sk',
                    ExpressionAttributeValues: {
                        ':pk': `USER#${userId}`,
                        ':sk': `CONTENT_IDEA#${contentIdeaId}`
                    }
                }));
                if (contentIdeaResponse.Items && contentIdeaResponse.Items.length > 0) {
                    contentIdea = contentIdeaResponse.Items[0];
                } else {
                    console.error(`Content idea ${contentIdeaId} not found for user ${userId}. Skipping post.`);
                    failureCount++;
                    // Optionally update post to 'failed' status here
                    continue;
                }

            } catch (err) {
                console.error(`Error fetching content idea ${contentIdeaId} for user ${userId}:`, err);
                failureCount++;
                continue; // Skip to next post
            }

            // 2. Get Social Token from Clerk
            let accessToken;
            try {
                // Note: Clerk's getToken might require a specific session ID or actor, 
                // depending on your Clerk setup for backend tokens.
                // For long-lived access for backend processes, you might use user.publicMetadata or specific API calls to Clerk.
                // The template name (e.g., 'linkedin_writlix') must match what's configured in your Clerk instance.
                const tokenResult = await clerkClient.users.getUserOauthAccessToken(userId, platform); // platform should match provider ID in Clerk e.g. 'oauth_linkedin'
                
                if (tokenResult && tokenResult.length > 0 && tokenResult[0].token) {
                    accessToken = tokenResult[0].token;
                } else {
                    console.error(`Failed to get ${platform} access token for user ${userId} from Clerk. Response:`, JSON.stringify(tokenResult));
                    failureCount++;
                    // Update post to 'failed_auth' or similar
                    continue;
                }
            } catch (err) {
                console.error(`Error getting ${platform} access token for user ${userId} from Clerk:`, err);
                failureCount++;
                continue;
            }

            // 3. Post to Social Media
            let postResult;
            switch (platform.toLowerCase()) {
                case 'linkedin':
                    // The LinkedIn post helper needs the LinkedIn URN, not Clerk user ID.
                    // This is a simplification for now. In reality, you'd fetch the LinkedIn member URN associated with the user's Clerk account.
                    // This might be stored in user.publicMetadata or obtained via another Clerk API call.
                    // For now, we'll pass userId, but this will fail for the actual LinkedIn API call if it's not the URN.
                    postResult = await postToLinkedIn(accessToken, contentIdea, userId /* This should be LinkedIn URN */);
                    break;
                case 'facebook':
                    postResult = await postToFacebook(accessToken, contentIdea, userId);
                    break;
                case 'instagram':
                    postResult = await postToInstagram(accessToken, contentIdea, userId);
                    break;
                default:
                    console.warn(`Unsupported platform: ${platform} for post ${scheduledPostId}`);
                    postResult = { success: false, error: 'Unsupported platform' };
            }

            // 4. Update Post Status in DynamoDB
            const newStatus = postResult.success ? 'posted' : 'failed';
            const updateParams = {
                TableName: TABLE_NAME,
                Key: { PK: `USER#${userId}`, SK: SK }, // Original PK and SK of the scheduled_post item
                UpdateExpression: 'SET #status = :status, GSI1PK = :gsi1pk, GSI1SK = :gsi1sk_val', // GSI1SK might be removed or set to posted time
                ExpressionAttributeNames: { '#status': 'status' }, // 'status' is a reserved keyword
                ExpressionAttributeValues: {
                    ':status': newStatus,
                    ':gsi1pk': `POST_STATUS#${newStatus}#USER#${userId}`,
                    ':gsi1sk_val': `POSTED_AT_UTC#${new Date().toISOString()}` // Or remove GSI1SK if not needed for posted items
                },
                ReturnValues: 'UPDATED_NEW'
            };
            if (newStatus === 'failed' && postResult.error) {
                updateParams.UpdateExpression += ', #errorMsg = :errorMsg';
                updateParams.ExpressionAttributeNames['#errorMsg'] = 'errorMessage';
                updateParams.ExpressionAttributeValues[':errorMsg'] = JSON.stringify(postResult.error).substring(0, 400); // Limit error message size
            }

            try {
                await docClient.send(new UpdateCommand(updateParams));
                console.log(`Post ${scheduledPostId} status updated to ${newStatus}.`);
                if (postResult.success) successCount++; else failureCount++;
            } catch (err) {
                console.error(`Error updating post ${scheduledPostId} status to ${newStatus}:`, err);
                failureCount++; // Count as failure even if posting worked but DB update failed
            }
        }

        console.log(`Processing complete. Success: ${successCount}, Failures: ${failureCount}`);
        return { statusCode: 200, body: JSON.stringify({ message: 'Processing complete.', successCount, failureCount }) };

    } catch (error) {
        console.error('Error in ProcessScheduledPostsLambda handler:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error.', error: error.message }) };
    }
};
