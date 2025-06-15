const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Initialize DynamoDB Client
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'WritlixSocialHub';

const dynamoDBClient = new DynamoDBClient({
  region: AWS_REGION,
  ...(DYNAMODB_ENDPOINT && { endpoint: DYNAMODB_ENDPOINT }), // Use endpoint for LocalStack if defined
});

// --- API Routes ---
// We will move these to separate route files later

// GET /api/schedule-settings
app.get('/api/schedule-settings', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }
  console.log(`GET /api/schedule-settings for userId: ${userId}`);
  try {
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: marshall({
        PK: `USER#${userId}`,
        SK: `SCHEDULE_SETTINGS#GENERAL`
      })
    };
    console.log('DynamoDB GetItem params:', params);
    const { Item } = await dynamoDBClient.send(new GetItemCommand(params));

    if (Item) {
      const settings = unmarshall(Item);
      console.log('Found schedule settings:', settings);
      // The frontend ApiScheduleSettings expects 'id', 'nextRunAt', 'timeOfDay'. Map attributes if names differ.
      // Assuming DynamoDB stores: frequency, timeOfDay, timezone, nextRunAt, (dayOfWeek, dayOfMonth)
      // And the 'id' for ApiScheduleSettings could be the SK or a combination.
      // For now, let's return the direct unmarshalled item, and adapt on frontend or here later if needed.
      res.status(200).json(settings);
    } else {
      console.log('No schedule settings found for user:', userId);
      res.status(404).json({ message: 'Schedule settings not found for this user.' });
    }
  } catch (error) {
    console.error('Error fetching schedule settings from DynamoDB:', error);
    res.status(500).json({ error: 'Failed to fetch schedule settings', details: error.message });
  }
});

// POST /api/schedule-settings
app.post('/api/schedule-settings', async (req, res) => {
  const { userId, frequency, timeOfDay, timezone } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required in the request body' });
  }
  console.log(`POST /api/schedule-settings for userId: ${userId}`, req.body);
  const { frequency: reqFrequency, timeOfDay: reqTimeOfDay, timezone: reqTimezone } = req.body;

  if (!reqFrequency || !reqTimeOfDay) {
    return res.status(400).json({ error: 'Missing required fields: frequency, timeOfDay' });
  }

  const effectiveTimezone = reqTimezone || 'UTC'; // Default to UTC if not provided

  // Calculate initial nextRunAt: tomorrow at the specified timeOfDay in the given timezone
  // This is a simplified calculation. For robust timezone handling and complex schedules,
  // consider a library like 'date-fns-tz' or 'luxon'.
  const now = new Date();
  const [hours, minutes, seconds] = reqTimeOfDay.split(':').map(Number);
  
  // Create a date object for tomorrow in UTC, then adjust to target timezone for calculation if needed,
  // but store final nextRunAt as UTC ISO string.
  // For simplicity here, we'll assume timeOfDay is meant for the 'timezone' provided.
  // The most robust way is to work in UTC and convert only for display or when timezone-specific logic is paramount.
  
  let nextRunDate = new Date(now);
  nextRunDate.setDate(now.getDate() + 1);
  // If using a library: const zonedTime = zonedTimeToUtc(`${year}-${month}-${day}T${timeOfDay}`, timezone);
  // For now, simple UTC date setting:
  nextRunDate.setUTCHours(hours, minutes, seconds || 0, 0);
  const nextRunAt = nextRunDate.toISOString();

  const settingsItem = {
    PK: `USER#${userId}`,
    SK: `SCHEDULE_SETTINGS#GENERAL`,
    userId,
    frequency: reqFrequency,
    timeOfDay: reqTimeOfDay,
    timezone: effectiveTimezone,
    nextRunAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Item: marshall(settingsItem)
    };
    console.log('DynamoDB PutItem params for schedule settings:', params);
    await dynamoDBClient.send(new PutItemCommand(params));
    console.log('Successfully created/updated schedule settings for user:', userId);
    // Return the item as it was saved, which matches frontend expectations
    res.status(201).json(settingsItem); 
  } catch (error) {
    console.error('Error creating/updating schedule settings in DynamoDB:', error);
    res.status(500).json({ error: 'Failed to save schedule settings', details: error.message });
  }
});

// POST /api/scheduled-posts
app.post('/api/scheduled-posts', async (req, res) => {
  const { userId, contentIdeaId, platform, scheduledAtUTC, timezone } = req.body;
  if (!userId || !contentIdeaId || !platform || !scheduledAtUTC) {
    return res.status(400).json({ error: 'Missing required fields: userId, contentIdeaId, platform, scheduledAtUTC' });
  }
  console.log(`POST /api/scheduled-posts for userId: ${userId}`, req.body);
  // The frontend sends contentIdeaId, platform, scheduledAtUTC, timezone.
  // The backend process-scheduled-posts expects contentId (which is the SK of the content idea).
  // For now, assume contentIdeaId from frontend is the SK of the content idea (e.g., CONTENT_IDEA#uuid).
  // If it's just the UUID part, we'd need to prepend 'CONTENT_IDEA#'.

  const postId = uuidv4();
  const createdAt = new Date().toISOString();

  const scheduledPostItem = {
    PK: `USER#${userId}`,
    SK: `SCHEDULED_POST#${platform}#${postId}`,
    userId,
    platform,
    contentId: contentIdeaId, // Assuming contentIdeaId is the full SK like 'CONTENT_IDEA#<uuid>'
    scheduledAtUTC,
    status: 'pending', // Initial status
    timezone: timezone || 'UTC', // Default to UTC if not provided by frontend
    createdAt,
    updatedAt: createdAt,
    // GSI1PK for querying by status and scheduledAtUTC for the processor Lambda
    GSI1PK: `STATUS#pending`, 
    GSI1SK: scheduledAtUTC 
  };

  try {
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Item: marshall(scheduledPostItem)
      // Consider adding ConditionExpression: 'attribute_not_exists(SK)' if SK must be unique and not overwritten
    };
    console.log('DynamoDB PutItem params for scheduled post:', params);
    await dynamoDBClient.send(new PutItemCommand(params));
    console.log('Successfully created scheduled post:', scheduledPostItem.SK);
    res.status(201).json(scheduledPostItem);
  } catch (error) {
    console.error('Error creating scheduled post in DynamoDB:', error);
    res.status(500).json({ error: 'Failed to create scheduled post', details: error.message });
  }
});

// PUT /api/schedule-settings - Update complete schedule settings
app.put('/api/schedule-settings', async (req, res) => {
  const { userId, frequency, timeOfDay, timezone, nextRunAt, dayOfWeek, dayOfMonth } = req.body;
  
  if (!userId || !frequency || !timeOfDay) {
    return res.status(400).json({ error: 'Missing required fields: userId, frequency, timeOfDay' });
  }
  
  console.log(`PUT /api/schedule-settings for userId: ${userId}`, req.body);
  
  try {
    // Build update expression dynamically based on provided fields
    let updateExpression = 'SET frequency = :frequency, timeOfDay = :timeOfDay, #timezone = :timezone, #updatedAt = :updatedAt';
    let expressionAttributeNames = {
      '#timezone': 'timezone',
      '#updatedAt': 'updatedAt'
    };
    let expressionAttributeValues = {
      ':frequency': frequency,
      ':timeOfDay': timeOfDay,
      ':timezone': timezone || 'UTC',
      ':updatedAt': new Date().toISOString()
    };

    // Add optional fields if provided
    if (nextRunAt) {
      updateExpression += ', nextRunAt = :nextRunAt';
      expressionAttributeValues[':nextRunAt'] = nextRunAt;
    }
    
    if (dayOfWeek !== undefined) {
      updateExpression += ', dayOfWeek = :dayOfWeek';
      expressionAttributeValues[':dayOfWeek'] = dayOfWeek;
    }
    
    if (dayOfMonth !== undefined) {
      updateExpression += ', dayOfMonth = :dayOfMonth';
      expressionAttributeValues[':dayOfMonth'] = dayOfMonth;
    }

    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: marshall({
        PK: `USER#${userId}`,
        SK: `SCHEDULE_SETTINGS#GENERAL`
      }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ReturnValues: 'ALL_NEW' // Return the entire updated item
    };
    
    console.log('DynamoDB UpdateItem params for schedule settings:', JSON.stringify(params, null, 2));
    const { Attributes } = await dynamoDBClient.send(new UpdateItemCommand(params));
    const updatedSettings = Attributes ? unmarshall(Attributes) : {};
    
    console.log('Successfully updated complete schedule settings for user:', userId, updatedSettings);
    res.status(200).json(updatedSettings);
    
  } catch (error) {
    console.error('Error updating schedule settings in DynamoDB:', error);
    res.status(500).json({ error: 'Failed to update schedule settings', details: error.message });
  }
});

// GET /api/scheduled-posts - Fetch scheduled posts for a user
app.get('/api/scheduled-posts', async (req, res) => {
  const { userId, status: queryStatus } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing required query parameter: userId' });
  }

  console.log(`GET /api/scheduled-posts for userId: ${userId}, status: ${queryStatus || 'any'}`);

  try {
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      KeyConditionExpression: 'PK = :pkval AND begins_with(SK, :skprefix)',
      ExpressionAttributeNames: {},
    };

    const expressionAttributeValues = {
      ':pkval': `USER#${userId}`,
      ':skprefix': 'SCHEDULED_POST#',
    };

    if (queryStatus) {
      params.FilterExpression = '#status = :statusval';
      params.ExpressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':statusval'] = queryStatus;
    }
    params.ExpressionAttributeValues = marshall(expressionAttributeValues);
    
    // If ExpressionAttributeNames is empty, remove it as DynamoDB expects it to be undefined or non-empty
    if (Object.keys(params.ExpressionAttributeNames).length === 0) {
      delete params.ExpressionAttributeNames;
    }

    console.log('DynamoDB Query params for scheduled posts:', JSON.stringify(params, null, 2));

    const { Items } = await dynamoDBClient.send(new QueryCommand(params));
    const posts = Items ? Items.map(item => unmarshall(item)) : [];
    
    console.log(`Found ${posts.length} scheduled posts for userId: ${userId}`);
    res.status(200).json(posts);

  } catch (error) {
    console.error('Error fetching scheduled posts from DynamoDB:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled posts', details: error.message });
  }
});

// --- Error Handling ---
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Export the handler for AWS Lambda
module.exports.handler = serverless(app);
