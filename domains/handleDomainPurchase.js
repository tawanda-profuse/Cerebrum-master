const { handleDomainPurchaseRequest } = require("./purchaseAndSetupDomain");
const logger = require("../logger");

const handleDomainPurchase = async (domainName, projectId) => {
  try {
    const serverIP = process.env.SERVER_IP;

    await handleDomainPurchaseRequest(domainName, serverIP, projectId);
  } catch (error) {
    logger.info("Error in handleDomainPurchase:", error);
    logger.info("An error occurred during the domain purchase process");
  }
};

module.exports = {
  handleDomainPurchase,
};
