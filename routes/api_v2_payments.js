require("dotenv").config();
const express = require("express");
const router = express.Router();
const UserModel = require("../models/User.schema");
const { verifyToken } = require("../utilities/functions");
const payuService = require("../payments/PayuService");
const request = require('request');
const posId = process.env.PAYU_SANDBOX_POS_ID;
const env = process.env.NODE_ENV || "development";
const baseURL =
  env === "production"
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_LOCAL_URL;

router.post("/user/buy_token", verifyToken, async (req, res) => {
  try {
    const token = await payuService.getToken();
    const amount = req.body.amount;
    const userId = req.user.id;

    const orderData = {
      continueUrl: `${baseURL}/payment-result?userId=${userId}`,
      customerIp: req.ip,
      merchantPosId: posId,
      description: "Token Purchase",
      currencyCode: "PLN",
      totalAmount: amount,
      payMethods: {
        payMethod: {
          type: "PBL",
          value: "c",
        },
      },
    };

    request(
      {
        method: "POST",
        url: "https://secure.snd.payu.com/api/v2_1/orders/",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      },
      async (error, response, body) => {
        if (error) {
          console.error("Error creating order:", error);
          return res
            .status(500)
            .json({
              success: false,
              message: "Order creation failed",
              error: error.message,
            });
        }
        try {
          const responseBody = JSON.parse(body);
          // Store the orderId in MongoDB
          await UserModel.addOrderId(userId, responseBody.orderId);

          res.json({ success: true, redirect: responseBody.redirectUri });
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          res
            .status(500)
            .json({
              success: false,
              message: "Error processing PayU response",
            });
        }
      },
    );
  } catch (error) {
    console.error("Error in /sendOrder:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/payment-result", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).send("User ID is missing");
    }

    const orderId = await UserModel.getOrderId(userId);
    if (!orderId) {
      console.log("No current order found for user:", userId);
      return res.send(
        "No current order found. Please try again or contact customer support.",
      );
    }

    const orderDetails = await payuService.getOrderDetails(orderId);

    // Check the order status
    if (orderDetails.orders && orderDetails.orders[0]) {
      const orderStatus = orderDetails.orders[0].status;

      if (orderStatus === "COMPLETED") {
        res.send("Payment successful! Thank you for your order.");
        await UserModel.updateUserProfileWithPayment(
          userId,
          orderDetails.orders[0].totalAmount / 100,
        );
      } else if (orderStatus === "PENDING") {
        res.send(
          "Payment is being processed. Please check back later for confirmation.",
        );
      } else {
        res.send(
          `Payment status: ${orderStatus}. Please contact customer support if you have any questions.`,
        );
      }
    } else {
      console.log("Unexpected order details format:", orderDetails);
      res.send(
        "Unable to determine payment status. Please contact customer support.",
      );
    }

    await UserModel.addOrderId(userId, null);
  } catch (error) {
    console.error("Error retrieving order details:", error);
    res
      .status(500)
      .send(
        "An error occurred while processing your payment. Please contact customer support.",
      );
  }
});

module.exports = router;
