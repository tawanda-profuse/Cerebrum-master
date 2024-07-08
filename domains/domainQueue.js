const Queue = require('bull');
const Redis = require('ioredis');
const { purchaseDomain, setupDNSRecords, getDNSRecords } = require('./domainOperations');
const logger = require('../logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Create a Bull queue
const domainQueue = new Queue('domain-purchase-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Process jobs in the queue
domainQueue.process(async (job) => {
  const { domain, serverIP, projectId } = job.data;
  
  logger.info(`Processing domain purchase for: ${domain}`);

  try {
    // Purchase domain
    const purchaseResult = await purchaseDomain(domain);
    if (!purchaseResult || purchaseResult.error) {
      throw new Error(`Domain purchase failed: ${purchaseResult ? purchaseResult.error : 'Unknown error'}`);
    }

    logger.info(`Domain purchased successfully: ${domain}`);

    // Wait for 30 seconds before setting up DNS records
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Setup DNS records
    await setupDNSRecords(domain, serverIP);

    // Verify DNS records
    const dnsRecords = await getDNSRecords(domain);
    const aRecords = dnsRecords.filter((record) => record.type === "A");

    if (aRecords.length !== 2 || !aRecords.some((r) => r.name === "@" && r.data === serverIP) || !aRecords.some((r) => r.name === "www" && r.data === serverIP)) {
      throw new Error("DNS records not set up correctly");
    }

    logger.info(`Domain purchase and setup completed successfully for: ${domain}`);

    // Here you can add any additional operations, like handleDomainMapping
    // await handleDomainMapping(domain, projectId);

    return { success: true, domain };
  } catch (error) {
    logger.error(`Error processing domain purchase for ${domain}:`, error);
    throw error; // Rethrow the error so Bull can handle retries
  }
});

// Function to add a domain purchase job to the queue
const queueDomainPurchase = async (domain, serverIP, projectId) => {
  const job = await domainQueue.add({ domain, serverIP, projectId });
  logger.info(`Domain purchase job queued for: ${domain}, Job ID: ${job.id}`);
  return job;
};

// Cleanup job to remove completed jobs
const cleanupCompletedJobs = async () => {
  try {
    await domainQueue.clean(86400000, 'completed'); // Remove completed jobs older than 24 hours
    logger.info('Cleanup of completed jobs finished');
  } catch (error) {
    logger.error('Error during cleanup of completed jobs:', error);
  }
};

// Run cleanup job every hour
setInterval(cleanupCompletedJobs, 3600000);

module.exports = {
  queueDomainPurchase,
  domainQueue,
};