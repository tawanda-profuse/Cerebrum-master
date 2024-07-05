// index.js
const { purchaseAndSetupDomain } = require('./purchaseAndSetupDomain');

const handleDomainPurchase = async (domainName) => {
  try {

    const contactInfo = {
      addressMailing: {
        address1: "Gierymskiego 3/45",
        city: "Warsaw",
        country: "PL",
        postalCode: "04228"
      },
      email: "admin@yeduai.io",
      nameFirst: "Cardinal",
      nameLast: "Ncube",
      phone: "+48.536892524"
    };;

    const serverIP = '51.20.79.114';

    // Run the domain purchase and setup process
    await purchaseAndSetupDomain(domainName, contactInfo, serverIP);

    console.log('Domain purchased and set up successfully' );
  } catch (error) {
    console.error('Error in handleDomainPurchase:', error);
    console.log('An error occurred during the domain purchase process');
  }
};

module.exports = {
  handleDomainPurchase
};