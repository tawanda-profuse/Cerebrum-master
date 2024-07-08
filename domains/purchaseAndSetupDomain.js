const axios = require("axios");
const rateLimit = require("axios-rate-limit");
const CircuitBreaker = require("opossum");
const Redis = require("ioredis");
const Redlock = require("redlock");
const Queue = require('bull');

const API_KEY = process.env.GODADDY_API_KEY;
const API_SECRET = process.env.GODADDY_API_SECRET;
const { domainRecords, domainData } = require('./payload');
const { handleDomainMapping } = require('./domainMapping')
const env = process.env.NODE_ENV || "development";
const logger = require("../logger");
const baseURL = env === "production" ? process.env.GODADDY_Prod_API_URL : process.env.GODADDY_Dev_API_URL;

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

// Create Redis client
const redisClient = new Redis(redisConfig);

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

// Create Redlock instance
const redlock = new Redlock(
  [redisClient],
  {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
    automaticExtensionThreshold: 500
  }
);

redlock.on('clientError', (err) => logger.error('Redlock Client Error', err));

// Create a rate-limited axios instance
const axiosInstance = rateLimit(axios.create(), { maxRequests: 5, perMilliseconds: 1000 });

// Circuit breaker options
const circuitBreakerOptions = {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

// Create a circuit breaker for API calls
const apiCircuitBreaker = new CircuitBreaker(async (config) => {
  return axiosInstance(config);
}, circuitBreakerOptions);

const makeApiCall = async (config) => {
  try {
    return await apiCircuitBreaker.fire(config);
  } catch (error) {
    logger.error(`API call failed: ${error.message}`, { config });
    throw error;
  }
};

const purchaseDomain = async (domain) => {
  const payload = await domainData(domain);
  try {
    const response = await makeApiCall({
      method: 'post',
      url: `${baseURL}/v1/domains/purchase`,
      data: payload,
      headers: {
        Authorization: `sso-key ${API_KEY}:${API_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    logger.error("Error purchasing domain:", error.response ? error.response.data : error.message, { domain });
    throw error;
  }
};

const getDNSRecords = async (domain) => {
  try {
    const response = await makeApiCall({
      method: 'get',
      url: `${baseURL}/v1/domains/${domain}/records`,
      headers: {
        Authorization: `sso-key ${API_KEY}:${API_SECRET}`,
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    logger.error("Error getting DNS records:", error.message, { domain });
    throw error;
  }
};

const setupDNSRecords = async (domain, serverIP) => {
  logger.info(`Setting up DNS records for: ${domain}`, { serverIP });

  const nameServers = await getNameservers(domain);
  logger.info("Current nameservers:", nameServers, { domain });
  const records = await domainRecords(serverIP, nameServers);
  try {
    const response = await makeApiCall({
      method: 'put',
      url: `${baseURL}/v1/domains/${domain}/records`,
      data: records,
      headers: {
        Authorization: `sso-key ${API_KEY}:${API_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    logger.info("DNS records updated successfully:", response.data, { domain });
    return response.data;
  } catch (error) {
    logger.error("Error updating DNS records:", error.response ? error.response.data : error.message, { domain });
    throw error;
  }
};

const getNameservers = async (domain) => {
  try {
    const response = await makeApiCall({
      method: 'get',
      url: `${baseURL}/v1/domains/${domain}`,
      headers: {
        Authorization: `sso-key ${API_KEY}:${API_SECRET}`,
        Accept: "application/json",
      },
    });
    return response.data.nameServers;
  } catch (error) {
    logger.error("Error getting nameservers:", error.message, { domain });
    throw error;
  }
};

const purchaseAndSetupDomain = async (domain, serverIP, projectId, maxRetries = 5, initialRetryDelay = 1000) => {
  logger.info(`Attempting to purchase and setup domain: ${domain}`, { serverIP, projectId });
  
  const lockKey = `domain_lock:${domain}`;
  const lockTTL = 10 * 60 * 1000; // 10 minutes in milliseconds

  let lock;
  try {
    // Acquire lock
    logger.info(`Attempting to acquire lock for domain: ${domain}`);
    lock = await redlock.lock(lockKey, lockTTL);
    logger.info(`Lock acquired for domain: ${domain}`);

    logger.info(`Starting purchase and setup process for domain: ${domain}`);

    const purchaseResult = await purchaseDomain(domain);
    logger.info("Domain purchased successfully:", purchaseResult, { domain });

    logger.info(`Waiting for 30 seconds before setting up DNS records for ${domain}`);
    await new Promise((resolve) => setTimeout(resolve, 30000));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await setupDNSRecords(domain, serverIP);

        const dnsRecords = await getDNSRecords(domain);
        const aRecords = dnsRecords.filter((record) => record.type === "A");

        if (aRecords.length !== 2 || !aRecords.some((r) => r.name === "@" && r.data === serverIP) || !aRecords.some((r) => r.name === "www" && r.data === serverIP)) {
          throw new Error("DNS records not set up correctly");
        }

        logger.info("DNS records set up and verified successfully", { domain });
        logger.info("Domain purchase and setup completed successfully!", { domain });

        // Uncomment the following line if you want to handle domain mapping
        // await handleDomainMapping(domain, projectId);

        return true;
      } catch (error) {
        logger.warn(`DNS setup attempt ${attempt} failed for ${domain}:`, error.message);

        if (attempt < maxRetries) {
          const delay = initialRetryDelay * Math.pow(2, attempt - 1);
          logger.info(`Waiting ${delay / 1000} seconds before next attempt for ${domain}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          logger.error(`Max retries reached. DNS setup failed for ${domain}`);
          return false;
        }
      }
    }
  } catch (error) {
    if (error.name === 'LockError') {
      logger.warn(`Failed to acquire lock for domain ${domain}. Error: ${error.message}`);
      return false;
    }
    logger.error(`Error in domain purchase and setup process for ${domain}:`, error);
    return false;
  } finally {
    if (lock) {
      try {
        await lock.unlock();
        logger.info(`Lock released for domain: ${domain}`);
      } catch (unlockError) {
        logger.error(`Error releasing lock for domain ${domain}:`, unlockError);
      }
    }
  }
};

// Create a queue
const domainPurchaseQueue = new Queue('domain-purchase', redisConfig);

// Process jobs from the queue
domainPurchaseQueue.process(async (job) => {
  const { domain, serverIP, projectId } = job.data;
  return await purchaseAndSetupDomain(domain, serverIP, projectId);
});

// Handle completed jobs
domainPurchaseQueue.on('completed', (job, result) => {
  logger.info(`Job completed for domain: ${job.data.domain}`, { result });
});

// Handle failed jobs
domainPurchaseQueue.on('failed', (job, err) => {
  logger.error(`Job failed for domain: ${job.data.domain}`, { error: err.message });
});

// Function to handle frequent requests
const handleDomainPurchaseRequest = async (domain, serverIP, projectId) => {
  const cacheKey = `domain_status:${domain}`;
  
  try {
    // Check if this domain is already being processed
    const status = await redisClient.get(cacheKey);
    if (status === 'processing') {
      logger.info(`Domain ${domain} is already being processed. Skipping.`);
      return { status: 'processing' };
    }
    
    // Set status to processing
    await redisClient.set(cacheKey, 'processing', 'EX', 600); // Expire in 10 minutes
    
    // Add job to queue
    const job = await domainPurchaseQueue.add(
      { domain, serverIP, projectId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // Start with a 1-minute delay
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    // Wait for the job to complete
    const result = await job.finished();
    
    // Update status based on result
    if (result) {
      await redisClient.set(cacheKey, 'completed', 'EX', 3600); // Expire in 1 hour
      return { status: 'completed' };
    } else {
      await redisClient.set(cacheKey, 'failed', 'EX', 3600); // Expire in 1 hour
      return { status: 'failed' };
    }
  } catch (error) {
    logger.error(`Error handling domain purchase request for ${domain}:`, error);
    await redisClient.set(cacheKey, 'error', 'EX', 3600); // Expire in 1 hour
    return { status: 'error', message: error.message };
  }
};

module.exports = {
  handleDomainPurchaseRequest,
};