const axios = require('axios');
require('dotenv').config();
const env = process.env.NODE_ENV || "development";
const baseURL =
  env === "production"
    ? process.env.PAYU_BASE_URL
    : process.env.PAYU_LOACAL_URL;
    const logger = require('../logger');

class PayUService {
  constructor() {
    this.baseUrl = baseURL;
    this.clientId = process.env.PAYU_SANDBOX_CLIENT_ID;
    this.clientSecret = process.env.PAYU_SANDBOX_CLIENT_SECRET;
    this.token = null;
  }

  async getOrderDetails(orderId) {
    try {
      const token = await this.getToken();
      const response = await axios.get(`${this.baseUrl}/api/v2_1/orders/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      logger.info('Error getting order details:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async getToken() {
    try {
      const response = await axios.post(`${this.baseUrl}/pl/standard/user/oauth/authorize`, null, {
        params: {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }
      });

      if (response.data && response.data.access_token) {
        this.token = response.data.access_token;
        return this.token;
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error) {
      logger.info('Error getting token:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

}

module.exports = new PayUService();
