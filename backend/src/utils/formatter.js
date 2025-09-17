/**
 * Utility functions for number formatting, parsing, and validation
 */

/**
 * Safely parse a value to a number
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - Parsed number or default value
 */
const parseNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Calculate total price from quantity and price per unit
 * @param {number|string} quantity - Product quantity
 * @param {number|string} pricePer - Price per unit
 * @returns {number} - Calculated total price
 */
const calculateTotalPrice = (quantity, pricePer) => {
  const qty = parseNumber(quantity);
  const price = parseNumber(pricePer);
  return qty * price;
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'KES')
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount, currency = 'KES') => {
  const numAmount = parseNumber(amount);
  
  if (currency === 'KES') {
    return `KSh ${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  // Default formatting for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(numAmount);
};

/**
 * Validate numeric input
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result with isValid and value
 */
const validateNumericInput = (value, fieldName, options = {}) => {
  const { min = 0, allowNegative = false, required = true } = options;
  
  // Check if required field is empty
  if (required && (value === null || value === undefined || value === '')) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} is required`
    };
  }
  
  // Parse the number
  const parsedValue = parseNumber(value);
  
  // Check if it's a valid number
  if (isNaN(parsedValue)) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} must be a valid number`
    };
  }
  
  // Check minimum value
  if (parsedValue < min) {
    return {
      isValid: false,
      value: parsedValue,
      error: `${fieldName} must be at least ${min}`
    };
  }
  
  // Check negative values
  if (!allowNegative && parsedValue < 0) {
    return {
      isValid: false,
      value: parsedValue,
      error: `${fieldName} cannot be negative`
    };
  }
  
  return {
    isValid: true,
    value: parsedValue,
    error: null
  };
};

/**
 * Ensure a value is a proper number for database storage
 * @param {any} value - Value to ensure is numeric
 * @returns {number} - Guaranteed numeric value
 */
const ensureNumeric = (value) => {
  return parseNumber(value);
};

module.exports = {
  parseNumber,
  calculateTotalPrice,
  formatCurrency,
  validateNumericInput,
  ensureNumeric
};
