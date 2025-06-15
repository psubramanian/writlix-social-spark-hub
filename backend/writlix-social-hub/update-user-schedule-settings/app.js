const { Pool } = require('pg');

// PostgreSQL connection pool
// Configuration will be picked up from environment variables:
// DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
const pool = new Pool();

/**
 * Calculates the next run time based on frequency and current settings.
 * @param {object} settings - The schedule settings.
 * @param {string} settings.frequency - e.g., 'daily', 'weekly', 'monthly'.
 * @param {string} settings.time_of_day - e.g., '10:00'.
 * @param {number} [settings.day_of_week] - 0 (Sun) to 6 (Sat), for 'weekly'.
 * @param {number} [settings.day_of_month] - 1 to 31, for 'monthly'.
 * @param {string} settings.timezone - e.g., 'UTC', 'America/New_York'. (Currently illustrative, not fully implemented for timezone-specific calculations beyond UTC base)
 * @param {number} [offset=0] - Number of intervals to advance.
 * @returns {Date} The calculated next run time in UTC.
 */
function calculateNextRunTime(settings, offset = 0) {
    console.log(`Calculating next run time with settings: ${JSON.stringify(settings)}, offset: ${offset}`);
    const { frequency, time_of_day, day_of_week, day_of_month, timezone } = settings;
    const [hours, minutes] = time_of_day.split(':').map(Number);

    // Start with the current date in UTC for calculations
    let nextRun = new Date();
    nextRun.setUTCHours(hours, minutes, 0, 0);

    // Add offset intervals
    for (let i = 0; i < offset; i++) {
        if (frequency === 'daily') {
            nextRun.setUTCDate(nextRun.getUTCDate() + 1);
        } else if (frequency === 'weekly') {
            nextRun.setUTCDate(nextRun.getUTCDate() + 7);
        } else if (frequency === 'monthly') {
            nextRun.setUTCMonth(nextRun.getUTCMonth() + 1);
        }
    }

    // Adjust based on frequency to find the *next* valid slot from today or the offset date
    switch (frequency) {
        case 'daily':
            // If current time is past today's schedule, or if no offset, advance to next day if needed
            if (new Date() > nextRun && offset === 0) {
                nextRun.setUTCDate(nextRun.getUTCDate() + 1);
            }
            break;
        case 'weekly':
            if (typeof day_of_week === 'number') {
                let currentDay = nextRun.getUTCDay();
                let daysToAdd = (day_of_week - currentDay + 7) % 7;
                if (daysToAdd === 0 && new Date() > nextRun && offset === 0) {
                    daysToAdd = 7; // Already past this week's day, move to next week
                }
                nextRun.setUTCDate(nextRun.getUTCDate() + daysToAdd);
            }
            break;
        case 'monthly':
            if (typeof day_of_month === 'number') {
                nextRun.setUTCDate(day_of_month);
                // If this month's day is past, or if it results in a date in the past for current month, move to next month
                if (new Date() > nextRun && offset === 0) {
                    nextRun.setUTCMonth(nextRun.getUTCMonth() + 1);
                    nextRun.setUTCDate(day_of_month); // Ensure day is correct after month change
                }
                 // Handle cases where day_of_month might exceed days in current/target month
                const originalMonth = nextRun.getUTCMonth();
                while (nextRun.getUTCMonth() !== originalMonth && nextRun.getUTCDate() !== day_of_month) {
                    // This can happen if day_of_month is e.g. 31 and current month is shorter
                    // The date object would have rolled over. We need to correct it.
                    // This logic might need refinement for perfect accuracy across all edge cases.
                    nextRun.setUTCDate(day_of_month -1); // try previous day until it matches
                    if (nextRun.getUTCDate() < day_of_month) break; // safety break
                }
            }
            break;
    }
    console.log(`Calculated nextRun: ${nextRun.toISOString()}`);
    return nextRun;
}

/**
 * Lambda handler function.
 * @param {object} event - The API Gateway event object.
 * @returns {Promise<object>} The HTTP response object.
 */
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        console.error('Error parsing request body:', e);
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Invalid JSON format in request body.' }),
        };
    }

    const { user_id, frequency, time_of_day, day_of_week, day_of_month, timezone } = requestBody;
    console.log('Received update request with params:', requestBody);

    // Basic Input Validation
    if (!user_id || !frequency || !time_of_day || !timezone) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Missing required fields: user_id, frequency, time_of_day, timezone.' }),
        };
    }
    if (frequency === 'weekly' && typeof day_of_week !== 'number') {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'day_of_week (0-6) is required for weekly frequency.' }),
        };
    }
    if (frequency === 'monthly' && typeof day_of_month !== 'number') {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'day_of_month (1-31) is required for monthly frequency.' }),
        };
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log(`Fetching pending posts for user_id: ${user_id}`);
        const { rows: pendingPosts } = await client.query(
            'SELECT id, created_at FROM scheduled_posts WHERE user_id = $1 AND status = $2 ORDER BY created_at ASC',
            [user_id, 'pending']
        );
        console.log(`Found ${pendingPosts.length} pending posts.`);

        const initialNextRunAt = calculateNextRunTime(requestBody, 0).toISOString();
        console.log(`Initial calculated next_run_at: ${initialNextRunAt}`);

        const settingsData = {
            user_id,
            frequency,
            time_of_day,
            day_of_week, // Will be null if not weekly
            day_of_month, // Will be null if not monthly
            timezone,
            next_run_at: initialNextRunAt,
            updated_at: new Date().toISOString(),
        };

        console.log('Upserting schedule settings:', settingsData);
        const upsertQuery = `
            INSERT INTO schedule_settings (user_id, frequency, time_of_day, day_of_week, day_of_month, timezone, next_run_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id)
            DO UPDATE SET
                frequency = EXCLUDED.frequency,
                time_of_day = EXCLUDED.time_of_day,
                day_of_week = EXCLUDED.day_of_week,
                day_of_month = EXCLUDED.day_of_month,
                timezone = EXCLUDED.timezone,
                next_run_at = EXCLUDED.next_run_at,
                updated_at = EXCLUDED.updated_at;
        `;
        await client.query(upsertQuery, [
            user_id, frequency, time_of_day, day_of_week, day_of_month, timezone, initialNextRunAt, settingsData.updated_at
        ]);
        console.log('Schedule settings upserted.');

        let updatedPostsCount = 0;
        for (let i = 0; i < pendingPosts.length; i++) {
            const post = pendingPosts[i];
            const postRunTime = calculateNextRunTime(requestBody, i).toISOString(); // Calculate time for this specific post
            console.log(`Updating post ID ${post.id} to be scheduled at ${postRunTime}`);
            await client.query(
                'UPDATE scheduled_posts SET scheduled_at = $1, status = $2 WHERE id = $3',
                [postRunTime, 'pending', post.id]
            );
            updatedPostsCount++;
        }
        console.log(`${updatedPostsCount} pending posts rescheduled.`);

        // Calculate the next_run_at for after all current pending posts are scheduled
        const finalNextRunAt = calculateNextRunTime(requestBody, pendingPosts.length).toISOString();
        console.log(`Final calculated next_run_at for schedule_settings: ${finalNextRunAt}`);
        await client.query(
            'UPDATE schedule_settings SET next_run_at = $1 WHERE user_id = $2',
            [finalNextRunAt, user_id]
        );
        console.log('Final next_run_at updated in schedule_settings.');

        await client.query('COMMIT');
        console.log('Transaction committed.');

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Schedule settings updated and pending posts rescheduled successfully.',
                user_id: user_id,
                updatedPostsCount: updatedPostsCount,
                next_run_at: finalNextRunAt
            }),
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during transaction, rolled back:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Internal server error', error: error.message }),
        };
    } finally {
        client.release();
        console.log('Database client released.');
    }
};
