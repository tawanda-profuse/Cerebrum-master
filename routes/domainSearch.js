const express = require("express");
const axios = require("axios");
const router = express.Router();
const env = process.env.NODE_ENV || "development";
const baseURL =
  env === "production"
    ? process.env.GODADDY_Prod_API_URL
    : process.env.GODADDY_Dev_API_URL;

const API_KEY = process.env.GODADDY_API_KEY;
const API_SECRET = process.env.GODADDY_API_SECRET;

router.get("/search", async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({ error: "Domain parameter is required" });
    }

    let searchDomain = domain;
    let tld = "com"; // Default TLD

    if (domain.includes(".")) {
      const parts = domain.split(".");
      searchDomain = parts[0];
      tld = parts.slice(1).join(".");
    }

    // Search for the exact domain
    const exactDomainResponse = await axios.get(
      `${baseURL}/domains/available?domain=${searchDomain}.${tld}`,
      {
        headers: {
          Authorization: `sso-key ${API_KEY}:${API_SECRET}`,
          Accept: "application/json",
        },
      }
    );

    // Get suggested domain names
    const suggestedDomainsResponse = await axios.get(
      `${baseURL}/domains/suggest?query=${searchDomain}&limit=15`,
      {
        headers: {
          Authorization: `sso-key ${API_KEY}:${API_SECRET}`,
          Accept: "application/json",
        },
      }
    );

    // Process the exact domain data
    const processedExactDomain = processExactDomain(exactDomainResponse.data);

    // Process suggested domain names
    const processedSuggestedDomains = await processSuggestedDomains(suggestedDomainsResponse.data);

    res.json({
      exactDomain: processedExactDomain,
      suggestions: processedSuggestedDomains,
    });
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ error: "An error occurred while searching for domains" });
  }
});

function processExactDomain(domainData) {
  return {
    domain: domainData.domain,
    available: domainData.available,
    price: formatPrice(domainData.price),
    promoPrice: formatPrice(domainData.listPrice),
    priceInfo: getPriceInfo(domainData),
    restrictions: getRestrictions(domainData),
    isPremium: domainData.isPremium || false,
    tld: domainData.domain.split('.').pop(),
  };
}

async function processSuggestedDomains(suggestedDomains) {
  const processedDomains = await Promise.all(
    suggestedDomains.map(async (domain) => {
      try {
        const availabilityResponse = await axios.get(
          `${baseURL}/domains/available?domain=${domain.domain}`,
          {
            headers: {
              Authorization: `sso-key ${API_KEY}:${API_SECRET}`,
              Accept: "application/json",
            },
          }
        );
        const domainData = availabilityResponse.data;
        if (!domainData.available) {
          return null; // Skip unavailable domains
        }
        return {
          domain: domainData.domain,
          available: domainData.available,
          price: formatPrice(domainData.price),
          promoPrice: formatPrice(domainData.listPrice),
          priceInfo: getPriceInfo(domainData),
          restrictions: getRestrictions(domainData),
          isPremium: domainData.isPremium || false,
          tld: domainData.domain.split('.').pop(),
        };
      } catch (error) {
        console.error(`Error checking availability for ${domain.domain}:`, error);
        return null;
      }
    })
  );

  return processedDomains.filter(domain => domain !== null);
}

function formatPrice(price) {
  if (typeof price === "number") {
    return (price / 1000000).toFixed(2);
  }
  return "N/A";
}

function getPriceInfo(domain) {
  if (domain.promotional) {
    return `1st yr only with ${domain.duration} yr term`;
  }
  return "for first year";
}

function getRestrictions(domain) {
  return domain.tld === "ca" ? "Restrictions apply." : "";
}

module.exports = router;
