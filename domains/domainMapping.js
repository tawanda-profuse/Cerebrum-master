require('dotenv').config();
const DomainMapping = require("../models/DomainMapping");

async function handleDomainMapping(domain, projectId) {
    try {
      //Save domain mapping to database
      const domainMapping = new DomainMapping({
        domain,
        projectId,
      });
      await domainMapping.save();
      // Trigger Jenkins job to configure Nginx
      const jenkinsUrl =
        "http://yeduai.io:8080/job/ConfigureNginx/buildWithParameters";
      const params = new URLSearchParams({
        token: process.env.JENKINS_TOKEN,
        domain: domain,
        projectId: projectId,
      });
      const response = await jenkinsCircuitBreaker.exec(() =>
        axios.post(`${jenkinsUrl}?${params}`, null, { timeout: API_TIMEOUT }),
      );
      if (response.status === 200 || response.status === 201) {
        logger.info("Domain mapping process initiated successfully");
        return {
          success: true,
          message: "Domain purchase, setup, and mapping completed successfully",
        };
      } else {
        throw new Error(
          `Failed to trigger Jenkins job. Status: ${response.status}`,
        );
      }
    } catch (error) {
      logger.info("Error in domain mapping process:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred in the domain mapping process",
      });
    }
  }
  
  module.exports = {
    handleDomainMapping,
  };
  