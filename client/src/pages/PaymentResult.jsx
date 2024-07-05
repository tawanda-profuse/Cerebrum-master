import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const env = process.env.NODE_ENV || "development";
const baseURL =
  env === "production"
    ? process.env.REACT_APP_PROD_API_URL
    : process.env.REACT_APP_DEV_API_URL;

function PaymentResult() {
  const [result, setResult] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPaymentResult = async () => {
      const params = new URLSearchParams(location.search);
      const jwtToken = params.get("token");
      if (!jwtToken) {
        setResult("Token is missing. Please try again or contact support.");
        setIsSuccess(false);
        return;
      }
      const type = params.get("type");

      try {
        const response = await axios.get(
          `${baseURL}/payments/payment-result?type=${type}`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          },
        );
        setResult(response.data);
        setIsSuccess(response.data.includes("successful"));
      } catch (error) {
        console.error("Error fetching payment result:", error);
        setResult(
          error.response?.data ||
            "An error occurred. Please try again or contact support.",
        );
        setIsSuccess(false);
      }
    };

    fetchPaymentResult();
  }, [location]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer);
          window.close();
          navigate("/");
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-green-600"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl p-10 shadow-xl text-center max-w-md w-full mx-4"
        >
          <div className="text-6xl mb-6">{isSuccess ? "✅" : "❌"}</div>
          <h1 className="text-4xl font-bold text-white mb-6">Payment Result</h1>
          <p className="text-xl text-white mb-4">{result}</p>
          <p className="text-sm text-white opacity-75">
            This page will close automatically in {countdown} seconds.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PaymentResult;
