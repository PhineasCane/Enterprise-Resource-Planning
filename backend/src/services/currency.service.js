const axios = require('axios');
const { currencyList } = require('../utils/currencyList.js');

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/KES';

class CurrencyService {
  constructor() {
    this.rates = null;
    this.lastUpdate = null;
    this.updateInterval = 1000 * 60 * 60; // 1 hour
  }

  async getRates() {
    const now = Date.now();
    if (!this.rates || !this.lastUpdate || (now - this.lastUpdate) > this.updateInterval) {
      try {
        const response = await axios.get(EXCHANGE_RATE_API);
        this.rates = response.data.rates;
        this.lastUpdate = now;
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to default rates if API fails
        this.rates = {
          KES: 1,
          USD: 0.007,
          GBP: 0.0055,
          EUR: 0.0065,
          AED: 0.026
        };
      }
    }
    return this.rates;
  }

  async convert(amount, fromCurrency, toCurrency) {
    const rates = await this.getRates();
    const inKES = amount / rates[fromCurrency];
    return inKES * rates[toCurrency];
  }

  formatAmount(amount, currency) {
    const currencyInfo = currencyList.find(c => c.currency_code === currency);
    if (!currencyInfo) return amount.toString();

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currencyInfo.cent_precision,
      maximumFractionDigits: currencyInfo.cent_precision
    }).format(amount);

    return currencyInfo.currency_position === 'before'
      ? `${currencyInfo.currency_symbol}${formatted}`
      : `${formatted}${currencyInfo.currency_symbol}`;
  }
}

module.exports = new CurrencyService();
