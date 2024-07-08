require('dotenv').config();
console.log("Node version:", process.version);

const Redlock = require('redlock');
console.log("Redlock version:", require('redlock/package.json').version);

const Redis = require("ioredis");

console.log("ELASTICACHE_HOST:", process.env.ELASTICACHE_HOST);
console.log("ELASTICACHE_PORT:", process.env.ELASTICACHE_PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

const client = new Redis({
  host: process.env.ELASTICACHE_HOST || 'localhost',
  port: process.env.ELASTICACHE_PORT || 6379,
  tls: process.env.NODE_ENV === "production"
});

client.on("error", (err) => console.log("Redis Client Error", err));
client.on("connect", () => console.log("Redis Client Connected"));

try {
  const redlock = new Redlock(
    [client],
    {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200
    }
  );
  console.log("Redlock instance created successfully");
} catch (error) {
  console.error("Error creating Redlock instance:", error);
}