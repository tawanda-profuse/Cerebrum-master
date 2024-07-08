require('dotenv').config();
console.log("Node version:", process.version);

const Redlock = require('redlock');
console.log("Redlock version:", require('redlock/package.json').version);

const Redis = require("ioredis");

console.log("REDIS_HOST:", process.env.REDIS_HOST || 'localhost');
console.log("REDIS_PORT:", process.env.REDIS_PORT || 6379);
console.log("NODE_ENV:", process.env.NODE_ENV);

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis Client Connected"));

async function testRedis() {
  try {
    await redisClient.set('test', 'It works!');
    const result = await redisClient.get('test');
    console.log("Redis Test Result:", result);
  } catch (error) {
    console.error("Redis Test Error:", error);
  }
}

try {
  const redlock = new Redlock(
    [redisClient],
    {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200
    }
  );
  console.log("Redlock instance created successfully");

  // Test Redlock
  async function testRedlock() {
    const resource = 'locks:test';
    try {
      const lock = await redlock.acquire([resource], 5000);
      console.log('Lock acquired successfully');
      await lock.unlock();
      console.log('Lock released successfully');
    } catch (error) {
      console.error('Error testing Redlock:', error);
    }
  }

  // Run tests
  (async () => {
    await testRedis();
    await testRedlock();
  })();

} catch (error) {
  console.error("Error creating Redlock instance:", error);
}