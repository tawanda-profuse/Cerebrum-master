// index.js
const { purchaseAndSetupDomain } = require('./domainLogic');
const { createSubaccount, getShopperDetails } = require('./shopperLogic');


const handleDomainPurchase = async (req, res) => {
  try {
    const domainName = req.body.domain;

    // Create a subaccount
    const subaccountInfo = {
      email: 'admin@yeduai.io',
      nameFirst: 'Cardinal',
      nameLast: 'Ncube',
      password: 'SecurePassword123!',
      marketId: 'en-US'
    };

    const subaccountResult = await createSubaccount(subaccountInfo);
    console.log('Subaccount created:', subaccountResult);

    // Get full shopper details
    const shopperDetails = await getShopperDetails(subaccountResult.shopperId);
    console.log('Shopper details:', shopperDetails);

    // Prepare information for domain purchase
    const shopperInfo = {
      shopperId: shopperDetails.shopperId
    };

    const contactInfo = {
      addressMailing: {
        address1: 'Gierymskiego 3/45',
        city: 'Warsaw',
        country: 'PL',
        postalCode: '04228',
      },
      email: 'admin@yeduai.io',
      nameFirst: 'Cardinal',
      nameLast: 'Ncube',
      phone: '+48536892524'
    };

    const serverIP = '51.20.79.114';

    // Run the domain purchase and setup process
    await purchaseAndSetupDomain(domainName, shopperInfo, contactInfo, serverIP);

    res.status(200).json({ message: 'Domain purchased and set up successfully', shopperId: shopperDetails.shopperId });
  } catch (error) {
    console.error('Error in handleDomainPurchase:', error);
    res.status(500).json({ error: 'An error occurred during the domain purchase process' });
  }
};

// If you're using Express, you might set up your route like this:
// app.post('/purchase-domain', handleDomainPurchase);

module.exports = {
  handleDomainPurchase
};