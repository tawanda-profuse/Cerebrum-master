const axios = require('axios');
const API_KEY = process.env.GODADDY_API_KEY;
const API_SECRET = process.env.GODADDY_API_SECRET;
const env = process.env.NODE_ENV || "development";
const baseURL =
  env === "production"
    ? process.env.GODADDY_Prod_API_URL
    : process.env.GODADDY_Dev_API_URL;

const getAgreements = async (tld, privacy = false) => {
  try {
    const response = await axios.get(`${baseURL}/domains/agreements`, {
      headers: {
        'Authorization': `sso-key ${API_KEY}:${API_SECRET}`,
        'X-Market-Id': 'en-US'
      },
      params: {
        tlds: tld,
        privacy: privacy
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error getting agreements:', error.response.data);
    throw error;
  }
};

const purchaseDomain = async (domain, shopperInfo, contactInfo) => {
  try {
    // Get the TLD from the domain
    const tld = domain.split('.').slice(1).join('.');

    // Get agreements
    const agreements = await getAgreements(tld);

    const response = await axios.post(`${baseURL}/domains/purchase`, {
      domain: domain,
      consent: {
        agreedAt: new Date().toISOString(),
        agreedBy: 'YeduAI',
        agreementKeys: agreements.map(agreement => agreement.agreementKey)
      },
      contactAdmin: contactInfo,
      contactBilling: contactInfo,
      contactRegistrant: contactInfo,
      contactTech: contactInfo,
      period: 1,
      renewAuto: true,
      privacy: false,
    }, {
      headers: {
        'Authorization': `sso-key ${API_KEY}:${API_SECRET}`,
        // 'X-Shopper-Id': shopperInfo.shopperId,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error purchasing domain:', error.response.data);
    throw error;
  }
};

const verifyDomainPurchase = async (domain, shopperId) => {
  try {
    const response = await axios.get(`${baseURL}/domains/${domain}`, {
      headers: {
        'Authorization': `sso-key ${API_KEY}:${API_SECRET}`,
        // 'X-Shopper-Id': shopperId
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error verifying domain purchase:', error.response.data);
    throw error;
  }
};

const setupDNSRecords = async (domain, serverIP, shopperId) => {
  try {
    const records = [
      {
        type: 'A',
        name: '@',
        data: serverIP,
        ttl: 3600
      },
      {
        type: 'A',
        name: 'www',
        data: serverIP,
        ttl: 3600
      }
    ];

    const response = await axios.put(`${baseURL}/domains/${domain}/records`, records, {
      headers: {
        'Authorization': `sso-key ${API_KEY}:${API_SECRET}`,
        // 'X-Shopper-Id': shopperId,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error setting up DNS records:', error.response.data);
    throw error;
  }
};

const purchaseAndSetupDomain = async (domain, shopperInfo, contactInfo, serverIP) => {
  try {
    console.log('Purchasing domain...');
    const purchaseResult = await purchaseDomain(domain, shopperInfo, contactInfo);
    console.log('Domain purchased successfully:', purchaseResult);

    console.log('Verifying domain purchase...');
    const verificationResult = await verifyDomainPurchase(domain, shopperInfo.shopperId);
    console.log('Domain verification successful:', verificationResult);

    console.log('Setting up DNS records...');
    const dnsSetupResult = await setupDNSRecords(domain, serverIP, shopperInfo.shopperId);
    console.log('DNS records set up successfully:', dnsSetupResult);

    console.log('Domain purchase and setup completed successfully!');
  } catch (error) {
    console.error('Error in domain purchase and setup process:', error);
  }
};

module.exports = {
  purchaseAndSetupDomain
};