require('dotenv').config();
const prisma = require('../services/prisma');
const redisClient = require('../services/redis');

async function run() {
  let hasError = false;
  
  try {
    console.log("Pinging Supabase (Postgres)...");
    // Querying an actual table ensures Supabase registers this as project activity
    const count = await prisma.token.count();
    console.log(`✅ Supabase ping successful. (Tokens count: ${count})`);
  } catch (err) {
    console.error("❌ Supabase ping failed:", err.message);
    hasError = true;
  } finally {
    await prisma.$disconnect();
  }

  try {
    console.log("Pinging Upstash (Redis)...");
    // Ensure redis connects before pinging if the async connect hasn't finished yet
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.ping();
    console.log("✅ Upstash ping successful.");
  } catch (err) {
    console.error("❌ Upstash ping failed:", err.message);
    hasError = true;
  } finally {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
    }
  }

  if (hasError) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
