const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'WritlixSocialHub';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1'; // Default region for LocalStack
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';

const dynamoDbClient = new DynamoDBClient({
    region: AWS_REGION,
    endpoint: DYNAMODB_ENDPOINT,
    // credentials for localstack are not strictly necessary but can be set to dummy values
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

/**
 * Calculates the next run time based on frequency, local time of day, and IANA timezone.
 */
function calculateNextRunTime(frequency, localTimeOfDayString, ianaTimezone, dayOfWeek, dayOfMonth, baseDateUtc = new Date(), offset = 0) {
    console.log(`Calculating next run time with frequency: ${frequency}, localTime: ${localTimeOfDayString}, timezone: ${ianaTimezone}, dayOfWeek: ${dayOfWeek}, dayOfMonth: ${dayOfMonth}, baseDate: ${baseDateUtc.toISOString()}, offset: ${offset}`);

    const [targetHours, targetMinutes] = localTimeOfDayString.split(':').map(Number);

    // Step 1: Get the date string (YYYY-MM-DD) for baseDateUtc as it appears in ianaTimezone.
    const datePartFormatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' gives YYYY-MM-DD format
        timeZone: ianaTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const dateStrInTz = datePartFormatter.format(baseDateUtc);

    // Step 2: Get the UTC offset string for the ianaTimezone (e.g., "-04:00", "+05:30").
    // Use a reference date (baseDateUtc) to get the offset, as it can change with DST.
    const offsetFormatter = new Intl.DateTimeFormat('en', { 
        timeZone: ianaTimezone, 
        timeZoneName: 'longOffset' // e.g., GMT-04:00
    });
    const offsetStringParts = offsetFormatter.formatToParts(baseDateUtc);
    let isoOffsetString = ""; // Target: "+HH:mm" or "-HH:mm"
    const gmtPart = offsetStringParts.find(p => p.type === 'timeZoneName' && p.value.startsWith('GMT'))?.value;
    if (gmtPart) {
        const match = gmtPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
        if (match) {
            const sign = match[1];
            const hr = match[2].padStart(2, '0');
            const min = match[3] ? match[3].padStart(2, '0') : '00';
            isoOffsetString = `${sign}${hr}:${min}`;
        }
    }

    if (!isoOffsetString) {
        console.warn(`Could not determine UTC offset for timezone '${ianaTimezone}'. Scheduling might be inaccurate. Defaulting to UTC interpretation for time.`);
        // Fallback: interpret localTimeOfDayString as UTC if offset cannot be determined.
        let fallbackRun = new Date(baseDateUtc);
        fallbackRun.setUTCHours(targetHours, targetMinutes, 0, 0);
        // If we hit this, the rest of the logic will use this potentially incorrect UTC time.
        // This is a simplification; robust error handling or a better offset method would be needed in production.
    }

    // Step 3: Construct the full ISO 8601 date-time string with offset and parse it.
    const fullDateTimeWithOffsetString = `${dateStrInTz}T${localTimeOfDayString}:00${isoOffsetString || 'Z'}`; // Append 'Z' if offset failed, treating as UTC.
    let nextRun = new Date(fullDateTimeWithOffsetString);

    if (isNaN(nextRun.getTime())) {
        console.error(`Failed to parse constructed date '${fullDateTimeWithOffsetString}'. Defaulting time to UTC components on baseDateUtc.`);
        nextRun = new Date(baseDateUtc);
        nextRun.setUTCHours(targetHours, targetMinutes, 0, 0); // Fallback to UTC interpretation
    }
    console.log(`Initial nextRun (UTC from local ${localTimeOfDayString} ${ianaTimezone}): ${nextRun.toISOString()}`);

    // --- The rest of the logic is similar to the original, operating on the UTC `nextRun` object ---

    // If the calculated time is in the past for today (and no offset), advance to the next cycle's start point.
    if (offset === 0 && baseDateUtc > nextRun) {
        if (frequency === 'daily') {
            nextRun.setUTCDate(nextRun.getUTCDate() + 1);
        } else if (frequency === 'weekly') {
            let currentDay = nextRun.getUTCDay(); // 0 (Sun) to 6 (Sat)
            let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
            if (daysToAdd === 0 && baseDateUtc > nextRun) daysToAdd = 7; // If it's today but past time, or if it's same day next week
            else if (daysToAdd === 0 && baseDateUtc <= nextRun) daysToAdd = 0; // It's today and time is not past
            nextRun.setUTCDate(nextRun.getUTCDate() + daysToAdd);
        } else if (frequency === 'monthly') {
            nextRun.setUTCMonth(nextRun.getUTCMonth() + 1, dayOfMonth); // dayOfMonth is 1-31
        }
    }
    
    // Add offset intervals from the adjusted start point
    for (let i = 0; i < offset; i++) {
        if (frequency === 'daily') {
            nextRun.setUTCDate(nextRun.getUTCDate() + 1);
        } else if (frequency === 'weekly') {
            nextRun.setUTCDate(nextRun.getUTCDate() + 7);
        } else if (frequency === 'monthly') {
            const currentMonth = nextRun.getUTCMonth();
            nextRun.setUTCMonth(currentMonth + 1);
            // If month rolled over, ensure dayOfMonth is respected (e.g. Feb 30 -> Mar 2)
            if (nextRun.getUTCMonth() === (currentMonth + 2) % 12) { // Month skipped
                nextRun.setUTCDate(0); // Last day of previous month
            }
            nextRun.setUTCDate(dayOfMonth); // Then set to desired dayOfMonth
        }
    }

    // Final adjustment for weekly and monthly to ensure the day is correct after offsets and month rolls
    if (frequency === 'weekly' && typeof dayOfWeek === 'number') {
        let currentDay = nextRun.getUTCDay();
        let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
        nextRun.setUTCDate(nextRun.getUTCDate() + daysToAdd);
    }
    // For monthly, dayOfMonth is set during offset loop and initial setup if past.
    // If dayOfMonth caused month to change (e.g. setting 31st on a 30-day month), it's handled by Date object.
    else if (frequency === 'monthly' && typeof dayOfMonth === 'number') {
         // Ensure the month is correct if dayOfMonth pushed it, then set the day.
        const intendedMonth = nextRun.getUTCMonth();
        nextRun.setUTCDate(dayOfMonth);
        if(nextRun.getUTCMonth() !== intendedMonth && nextRun.getUTCMonth() !== (intendedMonth + 1) % 12 ) {
            // This case means setting dayOfMonth pushed it too far, e.g. from Jan 31 to Mar 3 for Feb.
            // Set to last day of intended month.
            nextRun.setUTCMonth(intendedMonth + 1, 0);
        }
    }

    console.log(`Final calculated nextRun: ${nextRun.toISOString()}`);
    return nextRun;
}

async function batchWriteDynamoDB(items, type = 'PutRequest') {
    const MAX_BATCH_ITEMS = 25;
    for (let i = 0; i < items.length; i += MAX_BATCH_ITEMS) {
        const batch = items.slice(i, i + MAX_BATCH_ITEMS);
        const requestItems = {};
        requestItems[TABLE_NAME] = batch.map(item => {
            if (type === 'PutRequest') return { PutRequest: { Item: item } };
            if (type === 'DeleteRequest') return { DeleteRequest: { Key: item } };
            return {};
        });
        
        try {
            await docClient.send(new BatchWriteCommand({ RequestItems: requestItems }));
            console.log(`${type === 'PutRequest' ? 'Wrote' : 'Deleted'} batch of ${batch.length} items.`);
        } catch (error) {
            console.error(`Error batch ${type === 'PutRequest' ? 'writing' : 'deleting'} items:`, error);
            // Implement more sophisticated retry or error handling if needed
            throw error; 
        }
    }
}

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    let dataSource = event;
    // If event.body exists and is a string, parse it (typical for API Gateway Lambda proxy integration)
    if (event.body && typeof event.body === 'string') {
        try {
            dataSource = JSON.parse(event.body);
        } catch (error) {
            console.error('Error parsing event.body:', error);
            return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Invalid JSON in request body.' }) };
        }
    }

    // Extract parameters, allowing for different casings (e.g., userId vs user_id)
    // And providing default values where appropriate (like targetPlatforms)
    const user_id = dataSource.user_id || dataSource.userId;
    const frequency = dataSource.frequency;
    const time_of_day = dataSource.time_of_day || dataSource.timeOfDay;
    const day_of_week = dataSource.day_of_week || dataSource.dayOfWeek;
    const day_of_month = dataSource.day_of_month || dataSource.dayOfMonth;
    const timezone = dataSource.timezone;
    const targetPlatforms = dataSource.targetPlatforms || dataSource.platforms || ['linkedin']; // Default if not provided

    console.log('Processed parameters:', { user_id, frequency, time_of_day, day_of_week, day_of_month, timezone, targetPlatforms });

    // Validation
    if (!user_id || !frequency || !time_of_day || !timezone) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Missing required fields: user_id, frequency, time_of_day, timezone.' }) };
    }
    // Specific validation for day_of_week and day_of_month based on frequency
    if (frequency === 'weekly' && (day_of_week === undefined || day_of_week === null)) { // Check for undefined or null
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'day_of_week (0-6) is required for weekly frequency.' }) };
    }
    if (frequency === 'monthly' && (day_of_month === undefined || day_of_month === null)) { // Check for undefined or null
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'day_of_month (1-31) is required for monthly frequency.' }) };
    }
    if (!Array.isArray(targetPlatforms) || targetPlatforms.length === 0) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'targetPlatforms must be a non-empty array.' }) };
    }

    const scheduleSettingsForCalc = { // Renamed for clarity to avoid confusion with the similarly named object in calculateNextRunTime
        frequency: frequency,
        time_of_day: time_of_day,
        // Use the consistently named variables from the top of the handler
        day_of_week: frequency === 'weekly' && day_of_week !== undefined ? parseInt(day_of_week) : undefined,
        day_of_month: frequency === 'monthly' && day_of_month !== undefined ? parseInt(day_of_month) : undefined,
        timezone: timezone
    };

    try {
        // 1. Save/Update Schedule Settings
        const settingsItem = {
            PK: `USER#${user_id}`,
            SK: `SCHEDULE_SETTING`,
            userId: user_id,
            frequency,
            time_of_day: time_of_day, // Use the extracted variable
            day_of_week: frequency === 'weekly' ? day_of_week : undefined, // Use the extracted variable
            day_of_month: frequency === 'monthly' ? day_of_month : undefined, // Use the extracted variable
            timezone,
            platforms: targetPlatforms, // Use the extracted variable
            updatedAt: new Date().toISOString()
        };
        await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: settingsItem }));
        console.log('Schedule settings saved:', settingsItem);

        // 2. Fetch Approved Content Ideas for the user
        // For now, fetching all and filtering. Optimize with GSI if performance becomes an issue.
        const contentIdeasParams = {
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues: {
                ':pk': `USER#${user_id}`,
                ':sk_prefix': 'CONTENT_IDEA#',
            },
        };
        const { Items: allUserContentIdeas } = await docClient.send(new QueryCommand(contentIdeasParams));
        const approvedContentIdeas = allUserContentIdeas ? allUserContentIdeas.filter(idea => idea.status === 'approved') : [];
        console.log(`Found ${approvedContentIdeas.length} approved content ideas.`);

        if (approvedContentIdeas.length === 0) {
            console.log('No approved content ideas found to schedule.');
            // Optionally, clear pending posts even if no new content to schedule
        }

        // 3. Clear Existing Pending Scheduled Posts for the user
        const pendingPostsParams = {
            TableName: TABLE_NAME,
            IndexName: 'ScheduledPostsByStatusAndDate',
            KeyConditionExpression: 'GSI1PK = :gsi1pk',
            ExpressionAttributeValues: {
                ':gsi1pk': `POST_STATUS#pending#USER#${user_id}`,
            },
        };
        const { Items: pendingScheduledPosts } = await docClient.send(new QueryCommand(pendingPostsParams));
        
        if (pendingScheduledPosts && pendingScheduledPosts.length > 0) {
            console.log(`Found ${pendingScheduledPosts.length} existing pending posts to delete.`);
            const deleteRequests = pendingScheduledPosts.map(post => ({ PK: post.PK, SK: post.SK }));
            await batchWriteDynamoDB(deleteRequests, 'DeleteRequest');
            console.log('Cleared existing pending scheduled posts.');
        }

        // 4. Create New Scheduled Posts
        const newScheduledPostItems = [];
        let postIndex = 0;
        for (const platform of targetPlatforms) {
            for (const idea of approvedContentIdeas) {
                const scheduledPostId = uuidv4();
                const nextRunTime = calculateNextRunTime(scheduleSettingsForCalc.frequency, scheduleSettingsForCalc.time_of_day, scheduleSettingsForCalc.timezone, scheduleSettingsForCalc.day_of_week, scheduleSettingsForCalc.day_of_month, new Date(), postIndex).toISOString();
                
                const postItem = {
                    PK: `USER#${user_id}`,
                    SK: `SCHEDULED_POST#${platform}#${scheduledPostId}`, // Platform first for potential platform-specific queries on SK
                    scheduledPostId,
                    userId: user_id,
                    contentIdeaId: idea.contentIdeaId, // Ensure contentIdeaId is an attribute on the idea item
                    platform,
                    status: 'pending',
                    scheduledAtUTC: nextRunTime, // Add the scheduledAtUTC attribute to the main item
                    GSI1PK: `POST_STATUS#pending#USER#${user_id}`, 
                    GSI1SK: `SCHEDULED_AT_UTC#${nextRunTime}`, // Correct GSI Sort Key format
                    createdAt: new Date().toISOString(),
                };
                newScheduledPostItems.push(postItem);
                postIndex++;
            }
        }

        if (newScheduledPostItems.length > 0) {
            await batchWriteDynamoDB(newScheduledPostItems, 'PutRequest');
            console.log(`Created ${newScheduledPostItems.length} new scheduled posts.`);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Schedule settings updated and posts rescheduled successfully.', createdPosts: newScheduledPostItems.length, deletedPosts: (pendingScheduledPosts || []).length })
        };
    } catch (error) {
        console.error('Error processing schedule update:', error); // Updated console error message
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Failed to update schedule settings.', error: error.message }),
        };
    } // finally block can be removed if no specific cleanup for DynamoDB client here

};
