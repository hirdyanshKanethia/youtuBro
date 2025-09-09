const redisClient = require("./redis");

/**
 * Safely finds and deletes all keys in Redis that match a given pattern
 * by executing a Lua script directly on the Redis server.
 * @param {string} pattern - The pattern to match (e.g., "playlists:userId:*").
 */
async function deleteKeysByPattern(pattern) {
  
  const luaScript = `
    local keys = redis.call('SCAN', 0, 'MATCH', ARGV[1], 'COUNT', 1000)
    local deleted = 0
    for i, key in ipairs(keys[2]) do
      redis.call('DEL', key)
      deleted = deleted + 1
    end
    return deleted
  `;

  try {
    const deletedCount = await redisClient.eval(luaScript, {
      arguments: [pattern],
    });

    if (deletedCount > 0) {
      console.log(`[REDIS] Invalidated ${deletedCount} cached items via Lua script.`);
    } else {
      console.log("[REDIS] No matching keys found to invalidate.");
    }
  } catch (error) {
    console.error(`[REDIS] Error executing Redis Lua script for pattern "${pattern}":`, error);
  }
}

module.exports = { deleteKeysByPattern };