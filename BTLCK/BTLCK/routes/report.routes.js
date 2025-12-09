const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

router.get('/stock/current', reportController.getCurrentStock);
router.get('/stock/date', reportController.getStockByDate); 
router.get('/revenue/date', reportController.getRevenueByDate);
router.get('/revenue/month', reportController.getRevenueByMonth);
router.get('/top-selling', reportController.getTop5BestSelling);
router.get('/customer/:customerId/history', reportController.getCustomerHistory);

module.exports = router;