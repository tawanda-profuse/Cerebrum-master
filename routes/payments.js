require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const UserModel = require("../models/User.schema");
const { verifyToken } = require("../utilities/functions");
const payuService = require("../payments/PayuService");
const request = require("request");
const posId = process.env.PAYU_SANDBOX_POS_ID;
const logger = require("../logger");
const env = process.env.NODE_ENV || "development";
const { handleDomainPurchase } = require("../domains/handleDomainPurchase");
const baseURL =
  env === "production"
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_LOCAL_URL;
const PAYU_URL =
  env === "production"
    ? process.env.PAYU_BASE_URL
    : process.env.PAYU_LOACAL_URL;

router.post("/user/buy_token", verifyToken, async (req, res) => {
  try {
    const token = await payuService.getToken();
    const amount = req.body.amount;
    const userId = req.user.id;
    const jwtToken = jwt.sign(
      { userId, type: "token" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Convert to smallest currency unit (groszy) and round to integer
    const amountInGroszy = Math.round(amount * 100);

    // Convert to string
    const amountAsString = amountInGroszy.toString();

    const orderData = {
      continueUrl: `${baseURL}/payment-result?token=${jwtToken}&type=token`,
      customerIp: req.ip,
      merchantPosId: posId,
      description: "Token Purchase",
      currencyCode: "PLN",
      totalAmount: amountAsString,
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
        url: `${PAYU_URL}/api/v2_1/orders/`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      },
      async (error, response, body) => {
        if (error) {
          logger.info("Error creating order:", error);
          return res.status(500).json({
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
          logger.info("Error parsing response:", parseError);
          res.status(500).json({
            success: false,
            message: "Error processing PayU response",
          });
        }
      },
    );
  } catch (error) {
    logger.info("Error in /sendOrder:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/payment-result", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const type = req.query.type;
  if (!token) {
    return res.status(401).send("No token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).send("Invalid token");
  }

  const userId = decoded.userId;
  const orderType = decoded.type;

  if (orderType !== type) {
    return res.status(400).send("Order type mismatch");
  }
  if (!userId) {
    return res.status(400).send("User ID is missing");
  }
  const orderId = await UserModel.getOrderId(userId);

  // const orderId = await UserModel.getOrderId(userId);
  if (!orderId) {
    return res.send(
      "No current order found. Please try again or contact customer support.",
    );
  }
  const orderDetails = await payuService.getOrderDetails(orderId);
  const userOrders = await UserModel.getOrdersByUserId(userId);
  const domain = userOrders.domain;
  const projectId = userOrders.projectId;
  try {
    // Check the order status
    if (orderDetails.orders && orderDetails.orders[0]) {
      const orderStatus = orderDetails.orders[0].status;
      if (orderStatus === "COMPLETED") {
        res.send("Payment successful! Thank you for your order.");
        if (orderType === "token") {
          await UserModel.updateUserProfileWithPayment(
            userId,
            orderDetails.orders[0].totalAmount / 100,
          );
        } else if (orderType === "hosting") {
          await handleDomainPurchase(domain, projectId);
        }
      } else if (orderStatus === "PENDING") {
        res.send(
          "Payment is being processed. Please check back later for confirmation.",
        );
      } else {
        if (orderType === "hosting") {
          await UserModel.deleteOrderByUserIdAndDomain(userId, domain);
          s;
        }

        await UserModel.addOrderId(userId, null);
        res.send(
          `Payment status: ${orderStatus}. Please contact customer support if you have any questions.`,
        );
      }
    } else {
      if (orderType === "hosting") {
        await UserModel.deleteOrderByUserIdAndDomain(userId, domain);
        s;
      }
      await UserModel.addOrderId(userId, null);
      res.send(
        "Unable to determine payment status. Please contact customer support.",
      );
    }
  } catch (error) {
    if (orderType === "hosting") {
      await UserModel.deleteOrderByUserIdAndDomain(userId, domain);
      s;
    }
    await UserModel.addOrderId(userId, null);
    logger.info("Error retrieving order details:", error);
    res
      .status(500)
      .send(
        "An error occurred while processing your payment. Please contact customer support.",
      );
  }
});

router.post("/user/hosting", verifyToken, async (req, res) => {
  try {
    const token = await payuService.getToken();
    const userId = req.user.id;
    const jwtToken = jwt.sign(
      { userId, type: "hosting" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    const data = req.body;
    let total = data.total;

    // First, ensure total is a number
    if (typeof total !== "number") {
      total = parseFloat(total);
      if (isNaN(total)) {
        logger.info("Error: Total is not a valid number");
        return res
          .status(400)
          .json({ success: false, message: "Invalid total amount" });
      }
    }

    const totalInGroszy = Math.round(total * 100);

    // Convert to string
    const totalAsString = totalInGroszy.toString();

    const orderData = {
      continueUrl: `${baseURL}/payment-result?token=${jwtToken}&type=hosting`,
      customerIp: req.ip,
      merchantPosId: posId,
      description: "Hosting",
      currencyCode: "PLN",
      totalAmount: totalAsString,
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
        url: `${PAYU_URL}/api/v2_1/orders/`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      },
      async (error, response, body) => {
        if (error) {
          logger.info("Error creating order:", error);
          return res.status(500).json({
            success: false,
            message: "Order creation failed",
            error: error.message,
          });
        }
        try {
          const responseBody = JSON.parse(body);
          if (
            responseBody.status &&
            responseBody.status.statusCode !== "SUCCESS"
          ) {
            logger.info("PayU order creation failed:", responseBody.status);
            return res.status(400).json({
              success: false,
              message: "PayU order creation failed",
              error: responseBody.status.statusDesc,
            });
          }

          // Store the orderId in MongoDB
          await UserModel.addOrderId(userId, responseBody.orderId);

          // Prepare the order data for our database
          const ourOrderData = {
            userId: userId,
            ...data,
          };

          // Save the order to our database
          await UserModel.addOrder(ourOrderData);

          res.json({ success: true, redirect: responseBody.redirectUri });
        } catch (parseError) {
          logger.info("Error parsing response:", parseError);
          res.status(500).json({
            success: false,
            message: "Error processing PayU response",
          });
        }
      },
    );
  } catch (error) {
    logger.info("Error in /sendOrder:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
module.exports = router;
