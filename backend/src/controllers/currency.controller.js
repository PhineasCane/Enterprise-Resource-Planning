// currencyController.js
const axios = require('axios');
const currencyList = require('../utils/currencyData');

let cachedRates = null;
let lastFetched = null;
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 5; // 5 days in milliseconds

const getCurrencies = async (req, res) => {
  try {
    // If cached and still fresh, use cache
    if (cachedRates && Date.now() - lastFetched < CACHE_DURATION) {
      return res.json({
        defaultCurrency: currencyList[0].code, // KES
        currencyList,
        rates: cachedRates
      });
    }

    // Fetch fresh rates from API
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/KES');
    cachedRates = response.data.rates;
    lastFetched = Date.now();

    res.json({
      defaultCurrency: currencyList[0].code, // KES
      currencyList,
      rates: cachedRates
    });
  } catch (error) {
    console.error('Error fetching currency rates:', error.message);
    res.status(500).json({ error: 'Failed to fetch currency rates' });
  }
};

module.exports = { getCurrencies };
