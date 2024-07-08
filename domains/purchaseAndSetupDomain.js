// const axios = require("axios");
// const rateLimit = require("axios-rate-limit");
// const CircuitBreaker = require("opossum");
// const Redis = require("ioredis");
// const Redlock = require("redlock");

// const API_KEY = process.env.GODADDY_API_KEY;
// const API_SECRET = process.env.GODADDY_API_SECRET;
// const {
//   domainRecords,
//   domainData
// } = require('./payload');
// const DomainMapping = require("../models/DomainMapping");
// const env = process.env.NODE_ENV || "development";
// const logger = require("../logger");
// const baseURL =
//   env === "production"
//     ? process.env.GODADDY_Prod_API_URL
//     : process.env.GODADDY_Dev_API_URL;

// // ElastiCache configuration
// const elastiCacheConfig = {
//   host: process.env.ELASTICACHE_HOST,
//   port: process.env.ELASTICACHE_PORT || 6379,
//   tls: env === "production" 
// };

// // Create Redis client for ElastiCache
// const redisClient = new Redis(elastiCacheConfig);

// // Create Redlock instance
// const redlock = new Redlock(
//   [redisClient],
//   {
//     driftFactor: 0.01,
//     retryCount: 10,
//     retryDelay: 200,
//     retryJitter: 200
//   }
// );

// // Create a rate-limited axios instance
// const axiosInstance = rateLimit(axios.create(), { maxRequests: 5, perMilliseconds: 1000 });

// // Circuit breaker options
// const circuitBreakerOptions = {
//   timeout: 30000,
//   errorThresholdPercentage: 50,
//   resetTimeout: 30000
// };

// // Create a circuit breaker for API calls
// const apiCircuitBreaker = new CircuitBreaker(async (config) => {
//   return axiosInstance(config);
// }, circuitBreakerOptions);

const makeApiCall = async (config) => {
  try {
    return await apiCircuitBreaker.fire(config);
  } catch (error) {
    logger.info(`API call failed: ${error.message}`);
    throw error;
  }
};

const purchaseDomain = async (domain) => {
  const payload = await domainData(domain)
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
    logger.info(
      "Error details:",
      error.response ? error.response.data : error.message,
    );
    logger.info("Error");
    // throw error; // Uncomment if you want to propagate the error further
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
    logger.info("Error getting DNS records:", error.message);
    throw error;
  }
};

const setupDNSRecords = async (domain, serverIP) => {
  logger.info("Setting up DNS records for:", domain);
  logger.info("Server IP:", serverIP);

  // Get current nameservers
  const nameServers = await getNameservers(domain);
  logger.info("Current nameservers:", nameServers);
  const records = await domainRecords(serverIP,nameServers)
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

    logger.info("DNS records updated successfully:", response.data);
    return response.data;
  } catch (error) {
    logger.info("Error updating DNS records:");
    logger.info(
      "Status code:",
      error.response ? error.response.status : "No response",
    );
    logger.info("Error message:", error.message);
    logger.info(
      "Response data:",
      error.response
        ? JSON.stringify(error.response.data, null, 2)
        : "No response data",
    );
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
    logger.info("Error getting nameservers:", error.message);
    throw error;
  }
};

const purchaseAndSetupDomain = async (
  domain,
  serverIP,
  projectId,
  maxRetries = 3,
  retryDelay = 60000,
) => {
  // Acquire a lock for this domain
  const lock = await redlock.lock(`domain:${domain}`, 30000);

  try {
    logger.info("Purchasing domain...");
    const purchaseResult = await purchaseDomain(domain);

    if (!purchaseResult || purchaseResult.error) {
      logger.info(
        "Domain purchase failed:",
        purchaseResult ? purchaseResult.error : "Unknown error",
      );
      return false;
    }

    logger.info("Domain purchased successfully:", purchaseResult);

    logger.info("Waiting for 30 seconds before setting up DNS records...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    logger.info("Setting up DNS records...");

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await setupDNSRecords(domain, serverIP);

        // Verify DNS records
        const dnsRecords = await getDNSRecords(domain);
        const aRecords = dnsRecords.filter((record) => record.type === "A");

        if (
          aRecords.length !== 2 ||
          !aRecords.some((r) => r.name === "@" && r.data === serverIP) ||
          !aRecords.some((r) => r.name === "www" && r.data === serverIP)
        ) {
          throw new Error("DNS records not set up correctly");
        }

        logger.info("DNS records set up and verified successfully");
        logger.info("Domain purchase and setup completed successfully!");
        // try {
        //   //Save domain mapping to database
        //   const domainMapping = new DomainMapping({
        //     domain,
        //     projectId,
        //   });
        //   await domainMapping.save();
        //   // Trigger Jenkins job to configure Nginx
        //   const jenkinsUrl =
        //     "http://yeduai.io:8080/job/ConfigureNginx/buildWithParameters";
        //   const params = new URLSearchParams({
        //     token: process.env.JENKINS_TOKEN,
        //     domain: domain,
        //     projectId: projectId,
        //   });
        //   const response = await jenkinsCircuitBreaker.exec(() =>
        //     axios.post(`${jenkinsUrl}?${params}`, null, { timeout: API_TIMEOUT }),
        //   );
        //   if (response.status === 200 || response.status === 201) {
        //     logger.info("Domain mapping process initiated successfully");
        //     return {
        //       success: true,
        //       message:
        //         "Domain purchase, setup, and mapping completed successfully",
        //     };
        //   } else {
        //     throw new Error(
        //       `Failed to trigger Jenkins job. Status: ${response.status}`,
        //     );
        //   }
        // } catch (error) {
        //   logger.info("Error in domain mapping process:", error);
        //   res.status(500).json({
        //     success: false,
        //     message: "An error occurred in the domain mapping process",
        //   });
        // }
        return true;
      } catch (error) {
        logger.info(`DNS setup attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          logger.info(
            `Waiting ${retryDelay / 1000} seconds before next attempt...`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          logger.info("Max retries reached. DNS setup failed.");
          return false;
        }
      }
    }
  } catch (error) {
    logger.info("Error in domain purchase and setup process:", error);
    return false;
  } finally {
    // Release the lock
    await lock.unlock();
  }
};

module.exports = {
  purchaseAndSetupDomain,
};