const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { Clerk } = require("@clerk/clerk-sdk-node"); // Or require('@clerk/backend') depending on version and usage
// Axios will be used by linkedinService, not directly here anymore for posting.
const { postToLinkedIn } = require('./utils/linkedinService.js');
const { postToFacebook } = require('./utils/facebookService.js');
const { postToInstagram } = require('./utils/instagramService.js');

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
    credentials: { 
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const clerkClient = CLERK_SECRET_KEY ? Clerk({ secretKey: CLERK_SECRET_KEY }) : null;

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
            ':gsi1pk': `POST_STATUS#pending#USER#user_2yVhrQ5sN1TMfQ5Ux2he41z2HXn`, // TEMP: Target specific user for testing
            ':now_utc': `SCHEDULED_AT_UTC#${nowUTC}`
        },
        // Limit to process a certain number of posts per invocation if needed
        // Limit: 10 
    };

    try {
        console.log('Querying for due posts with params:', JSON.stringify(params));
        const { Items: scheduledPostItems } = await docClient.send(new QueryCommand(params));

        if (!scheduledPostItems || scheduledPostItems.length === 0) {
            console.log('No posts currently due for publishing.');
            return { statusCode: 200, body: 'No posts due.' };
        }

        console.log(`Found ${scheduledPostItems.length} posts to process.`);
        let successCount = 0;
        let failureCount = 0;

        for (const post of scheduledPostItems) {
            console.log('DEBUG: Raw post object from duePosts.Items:', JSON.stringify(post, null, 2));
            let success = false; // Reset success flag for each post
            let contentIdea; // Declare contentIdea here

            try { // This is the main try block for processing a single post
                const { userId, contentIdeaId, platform, scheduledPostId } = post;
                console.log(`DEBUG: Extracted from post - userId: ${userId}, contentIdeaId: ${contentIdeaId}, platform: ${platform}, scheduledPostId: ${scheduledPostId}`);

                // 1. Fetch Content Idea
                try { // Inner try-catch specifically for fetching contentIdea
                    const getParams = {
                        TableName: TABLE_NAME,
                        Key: {
                            PK: { S: `USER#${userId}` }, // Correctly prefix USER#
                            SK: { S: `CONTENT_IDEA#${contentIdeaId}` }
                        }
                    };
                    console.log(`DEBUG: TABLE_NAME for GetItem: ${TABLE_NAME}`);
                    console.log(`DEBUG: getParams for GetItem (raw):`, getParams);
                    try {
                        console.log('DEBUG: getParams for GetItem (stringified):', JSON.stringify(getParams));
                    } catch (e) {
                        console.error('DEBUG: Error stringifying getParams:', e);
                    }
                    const { Item: rawContentIdea } = await dynamoDbClient.send(new GetItemCommand(getParams));

                    if (rawContentIdea) {
                        contentIdea = {};
                        for (const keyInRaw in rawContentIdea) {
                            if (rawContentIdea[keyInRaw].S) contentIdea[keyInRaw] = rawContentIdea[keyInRaw].S;
                            else if (rawContentIdea[keyInRaw].N) contentIdea[keyInRaw] = Number(rawContentIdea[keyInRaw].N);
                            else if (rawContentIdea[keyInRaw].BOOL) contentIdea[keyInRaw] = rawContentIdea[keyInRaw].BOOL;
                            else contentIdea[keyInRaw] = Object.values(rawContentIdea[keyInRaw])[0];
                        }
                        console.log('DEBUG: Successfully fetched and unmarshalled contentIdea:', contentIdea);
                    } else {
                        console.error(`Content idea ${contentIdeaId} not found for user ${userId}. Skipping post.`);
                        failureCount++;
                        continue; // Skip to the next post in the outer loop
                    }
                } catch (err) {
                    console.error(`Error fetching content idea ${contentIdeaId} for user ${userId}:`, err);
                    failureCount++;
                    continue; // Skip to the next post in the outer loop
                }

                // 2. Get OAuth Token from Clerk
                let accessToken;
                let authorUrn; // Declare here for broader scope
                try {
                    // Note: Clerk's getToken might require a specific session ID or actor, 
                    // depending on your Clerk setup for backend tokens.
                    // For long-lived access for backend processes, you might use user.publicMetadata or specific API calls to Clerk.
                    // The template name (e.g., 'linkedin_writlix') must match what's configured in your Clerk instance.
                    // providerString = `oauth_${platform.toLowerCase()}`; // Original attempt
                    providerString = `oauth_${platform.toLowerCase()}_oidc`; // Trying OIDC specific provider string
                    // If platform is 'linkedin', this will become 'oauth_linkedin_oidc'
                    console.log(`DEBUG: Attempting to get OAuth token for user ${userId}, provider: ${providerString}`);
                    const clerkTokenResponse = await clerkClient.users.getUserOauthAccessToken(userId, providerString);
                    console.log(`DEBUG: Clerk token response for ${platform} for user ${userId}:`, JSON.stringify(clerkTokenResponse, null, 2));

                    if (!clerkTokenResponse || clerkTokenResponse.length === 0 || !clerkTokenResponse[0].token) {
                        console.error(`Failed to get ${platform} access token for user ${userId} from Clerk. Response:`, JSON.stringify(clerkTokenResponse));
                        failureCount++;
                        // Update post to 'failed_auth' or similar. The main catch block will handle updating status.
                        throw new Error(`Failed to get ${platform} access token from Clerk.`); // Throw to be caught by main try-catch
                    } else {
                        accessToken = clerkTokenResponse[0].token;
                        // Attempt to get the full user object to find LinkedIn URN
                        try {
                            const clerkUser = await clerkClient.users.getUser(userId);
                            console.log(`DEBUG: Full Clerk user object for ${userId}:`, JSON.stringify(clerkUser, null, 2));
                            
                            if (platform === 'linkedin') {
                                const linkedInAccount = clerkUser.externalAccounts?.find(acc => acc.provider === 'oauth_linkedin_oidc');
                                if (linkedInAccount && linkedInAccount.externalId) {
                                    authorUrn = `urn:li:person:${linkedInAccount.externalId}`;
                                    console.log(`DEBUG: Constructed LinkedIn Author URN: ${authorUrn}`);
                                } else {
                                    console.error(`ERROR: Could not find LinkedIn externalId in Clerk user object for user ${userId}.`);
                                    throw new Error(`Missing LinkedIn externalId for user ${userId}, cannot construct author URN.`);
                                }
                            }
                        } catch (userFetchErr) { // Renamed userErr for clarity
                            console.error(`ERROR: Failed to fetch Clerk user object to get LinkedIn externalId for user ${userId}:`, userFetchErr);
                            throw new Error(`Failed to fetch Clerk user details for LinkedIn URN for user ${userId}. Cause: ${userFetchErr.message}`);
                        }
                    }
                } catch (err) {
                    console.error(`Error getting ${platform} access token for user ${userId} (provider: ${providerString}) from Clerk. Full error:`, JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
                    failureCount++;
                    // The main catch block will handle updating status.
                    throw err; // Re-throw to be caught by main try-catch, ensuring post status is updated to failed
                }

                // 3. Post to Social Media
                let postResult;
                switch (platform.toLowerCase()) {
                    case 'linkedin':
                        if (!authorUrn) {
                            console.error(`ERROR: LinkedIn Author URN not constructed for user ${userId}. Cannot post.`);
                            postResult = { success: false, error: 'LinkedIn Author URN missing.' };
                        } else {
                            console.log(`Handler: Attempting to post to LinkedIn. Author URN: ${authorUrn}, Content: ${contentIdea.content ? contentIdea.content.substring(0,50) + '...' : 'undefined'}`);
                            postResult = await postToLinkedIn(authorUrn, contentIdea.content, accessToken);
                        }
                        break;
                    case 'facebook':
                        postResult = await postToFacebook(accessToken, contentIdea.content, userId);
                        break;
                    case 'instagram':
                        postResult = await postToInstagram(accessToken, contentIdea.content, userId);
                        break;
                    default:
                        console.warn(`Unsupported platform: ${platform} for post ${scheduledPostId}`);
                        postResult = { success: false, error: 'Unsupported platform' };
                }

                // 4. Update Post Status in DynamoDB
                const newStatus = postResult.success ? 'posted' : 'failed';
                const updateParams = {
                    TableName: TABLE_NAME,
                    Key: { PK: `USER#${userId}`, SK: `SCHEDULED_POST#${scheduledPostId}` }, // Original PK and SK of the scheduled_post item
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
            } catch (err) { // Catch for the main try block within the for...of loop (processing a single post)
                console.error(`Error processing post ${post && post.scheduledPostId ? post.scheduledPostId : 'unknown_post_in_loop_catch'}:`, err);
                failureCount++;
                // General error for the post, continue to the next one
                continue;
            }
        } // End of for...of loop

        console.log(`Processing complete. Success: ${successCount}, Failures: ${failureCount}`);
        return { statusCode: 200, body: JSON.stringify({ message: 'Processing complete.', successCount, failureCount }) };

    } catch (error) { // Catch for the main try block of the exports.handler
        console.error('Error in ProcessScheduledPostsLambda handler:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error.', error: error.message }) };
    }
};
