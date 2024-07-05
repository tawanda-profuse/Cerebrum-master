const axios = require('axios');
const API_KEY = process.env.GODADDY_API_KEY;
const API_SECRET = process.env.GODADDY_API_SECRET;
const env = process.env.NODE_ENV || "development";
const baseURL =
  env === "production"
    ? process.env.GODADDY_Prod_API_URL
    : process.env.GODADDY_Dev_API_URL;

    const purchaseDomain = async (domain, contactInfo) => {
      try {
        const response = await axios.post(`${baseURL}/domains/purchase`, {
          domain: 'example-test.com',
          consent: {
            agreementKeys: ["DNRA"],
            agreedBy: '10.37.80.97',
            agreedAt: new Date().toISOString()
          },
          period: 1,
          renewAuto: false,
          contactAdmin: contactInfo,
          contactBilling: contactInfo,
          contactRegistrant: contactInfo,
          contactTech: contactInfo,
        }, {
          headers: {
            'Authorization': `sso-key ${API_KEY}:${API_SECRET}`,
            'Content-Type': 'application/json'
          }
        });
    
        return response.data;
      } catch (error) {
        console.error('Error purchasing domain:', error.response.data);
        throw error;
      }
    };

const verifyDomainPurchase = async (domain) => {
  try {
    const response = await axios.get(`${baseURL}/domains/${domain}`, {
      headers: {
        'Authorization': `sso-key ${API_KEY}:${API_SECRET}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error verifying domain purchase:', error.response.data);
    throw error;
  }
};

const setupDNSRecords = async (domain, serverIP) => {
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
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error setting up DNS records:', error.response.data);
    throw error;
  }
};

const purchaseAndSetupDomain = async (domain, contactInfo, serverIP) => {
  try {
    console.log('Purchasing domain...');
    const purchaseResult = await purchaseDomain(domain, contactInfo);
    console.log('Domain purchased successfully:', purchaseResult);

    console.log('Verifying domain purchase...');
    const verificationResult = await verifyDomainPurchase(domain);
    console.log('Domain verification successful:', verificationResult);

    console.log('Setting up DNS records...');
    const dnsSetupResult = await setupDNSRecords(domain, serverIP);
    console.log('DNS records set up successfully:', dnsSetupResult);

    console.log('Domain purchase and setup completed successfully!');
  } catch (error) {
    console.error('Error in domain purchase and setup process:', error);
  }
};

module.exports = {
  purchaseAndSetupDomain
};