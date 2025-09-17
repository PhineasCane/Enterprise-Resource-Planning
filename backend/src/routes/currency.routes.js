// routes.js
const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const currencyController = require('../controllers/currency.controller');

const router = express.Router();

// Apply authentication middleware to all currency routes
router.use(protect);

router.get('/currencies', currencyController.getCurrencies);

module.exports = router;
