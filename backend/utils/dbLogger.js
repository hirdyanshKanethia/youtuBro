const prisma = require('../services/prisma'); 

/**
 * Logs a successful agent action to the database.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} message - The action_message to be logged.
 */
async function logActionToDB(userId, message) {
  if (!userId || !message) {
    console.error("logActionToDB Error: Missing userId or message.");
    return;
  }

  try {
    await prisma.action.create({
      data: {
        user_id: userId,
        message: message,
      }
    });

    console.log(`[DB Logger] Successfully logged action for user: ${userId}`);
  } catch (error) {
    console.error(`[DB Logger] Failed to log action for user ${userId}:`, error.message);
  }
}

module.exports = { logActionToDB };