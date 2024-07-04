// shopperLogic.js
const axios = require('axios');
const API_KEY = process.env.GODADDY_API_KEY;
const API_SECRET = process.env.GODADDY_API_SECRET;
const env = process.env.NODE_ENV || "development";
const baseURL =
  env === "production"
    ? process.env.GODADDY_Prod_API_URL
    : process.env.GODADDY_Dev_API_URL;

const createSubaccount = async (subaccountInfo) => {
  try {
    const response = await axios.post(`${baseURL}/shoppers/subaccount`, subaccountInfo, {
      headers: {
        'Authorization': `sso-key ${API_KEY}:${API_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error creating subaccount:', error.response.data);
    throw error;
  }
};

const getShopperDetails = async (shopperId) => {
  try {
    const response = await axios.get(`${baseURL}/shoppers/${shopperId}`, {
      headers: {
        'Authorization': `sso-key ${API_KEY}:${API_SECRET}`
      },
      params: {
        includes: 'customerId'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error getting shopper details:', error.response.data);
    throw error;
  }
};

module.exports = {
  createSubaccount,
  getShopperDetails
};