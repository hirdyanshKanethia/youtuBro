const { createClient } = require('redis')

const redisUrl = process.env.REDIS_URL

const redisClient = createClient({
    url: redisUrl
})

redisClient.on('error', (err) => console.log('Redis Client Error: ', err))

redisClient.connect().catch(console.error)

module.exports = redisClient