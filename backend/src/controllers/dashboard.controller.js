const {
  Invoice,
  InvoiceItem,
  Payment,
  Expense,
  Customer,
  Product,
  Inventory,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { ensureNumeric } = require("../utils/formatter");

// Simple in-memory cache for dashboard data
const dashboardCache = new Map();

// Helper function to get date range based on time filter
const getDateRange = (timeFilter) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeFilter) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 6); // Last 7 days including today
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setDate(1); // Start of current month
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setMonth(0, 1); // Start of current year
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'total':
      // For total, we want all data from the beginning
      startDate.setFullYear(1900, 0, 1); // Set to a very early date
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(1); // Default to start of current month
      startDate.setHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate: now };
};

// Helper function to safely get sum with fallback to 0
const safeSum = async (model, field, options = {}) => {
  try {
    const result = await model.sum(field, options);
    return ensureNumeric(result) || 0;
  } catch (error) {
    console.error(`Error calculating sum for ${model.name}.${field}:`, error.message);
    return 0;
  }
};

// Helper function to format dates nicely
const formatDateNicely = (date) => {
  const options = { 
    month: 'long', 
    day: 'numeric' 
  };
  const formatted = date.toLocaleDateString('en-US', options);
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                day === 2 || day === 22 ? 'nd' : 
                day === 3 || day === 23 ? 'rd' : 'th';
  return formatted.replace(day.toString(), day + suffix);
};

// Test endpoint to check basic functionality
exports.test = async (req, res) => {
  try {
    console.log('Dashboard test endpoint called');
    
    // Test basic model access
    const customerCount = await Customer.count() || 0;
    const invoiceCount = await Invoice.count() || 0;
    const paymentCount = await Payment.count() || 0;
    
    res.json({
      message: 'Dashboard test successful',
      counts: {
        customers: customerCount,
        invoices: invoiceCount,
        payments: paymentCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard test error:', error);
    res.status(500).json({
      error: 'Dashboard test failed',
      details: error.message,
      stack: error.stack
    });
  }
};

// Phase 1: Basic Stats Endpoint (FAST - 1-2 seconds)
exports.getBasicStats = async (req, res) => {
  try {
    console.log('Basic stats request received:', req.query);
    const { timeFilter = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(timeFilter);

    // Check cache first
    const cacheKey = `basic:${timeFilter}`;
    if (dashboardCache.has(cacheKey)) {
      const cachedData = dashboardCache.get(cacheKey);
      // Return cached data if it's less than 2 minutes old
      if (Date.now() - cachedData.timestamp < 2 * 60 * 1000) {
        console.log('Returning cached basic stats');
        return res.json(cachedData.data);
      }
    }

    console.log('Date range:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      startDateLocal: startDate.toLocaleString(),
      endDateLocal: endDate.toLocaleString()
    });

    // Debug: Check all invoices in date range
    const debugInvoices = await Invoice.findAll({
      attributes: ['id', 'status', 'createdAt'],
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      order: [['createdAt', 'DESC']]
    });
    console.log('🔍 Debug: Invoices in date range:', debugInvoices.length, 'invoices');
    if (debugInvoices.length > 0) {
      console.log('🔍 Sample invoice:', {
        id: debugInvoices[0].id,
        status: debugInvoices[0].status,
        createdAt: debugInvoices[0].createdAt
      });
    }

    // Debug: Check all unique status values in the database
    const allStatuses = await Invoice.findAll({
      attributes: ['status'],
      group: ['status']
    });
    console.log('🔍 All unique invoice statuses in database:', allStatuses.map(s => s.status));

    // Execute multiple queries in parallel instead of sequentially
    const [
      totalRevenue,
      totalExpenses,
      invoiceCounts,
      newCustomers,
      lowStock
    ] = await Promise.all([
      // Total Revenue
      safeSum(Payment, "amount", {
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      }),
      
      // Total Expenses
      safeSum(Expense, "amount", {
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      }),
      
      // Invoice counts (all in one query)
      Invoice.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { createdAt: { [Op.between]: [startDate, endDate] } },
        group: ['status']
      }),
      
      // New customers
      Customer.count({
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      }),
      
      // Low stock items
      Inventory.count({
        where: { quantity: { [Op.lte]: sequelize.col('reorderLevel') } }
      })
    ]);

    // Process invoice counts - SIMPLE AND DIRECT
    console.log('📊 Raw invoice counts:', invoiceCounts);
    
    // Access the count directly from dataValues
    const paid = parseInt(invoiceCounts.find(i => i.status === 'paid')?.dataValues?.count || 0);
    const unpaid = parseInt(invoiceCounts.find(i => i.status === 'pending')?.dataValues?.count || 0);
    const overdue = parseInt(invoiceCounts.find(i => i.status === 'overdue')?.dataValues?.count || 0);
    
    const totalInvoices = paid + unpaid + overdue;
    console.log('📊 Final invoice stats:', { paid, unpaid, overdue, totalInvoices });

    const response = {
      timeFilter,
      totalRevenue,
      totalExpenses,
      invoiceStats: { paid, unpaid, overdue, totalInvoices },
      newCustomers,
      lowStock,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    // Cache the result
    dashboardCache.set(cacheKey, {
      timestamp: Date.now(),
      data: response
    });

    console.log('Basic stats response prepared successfully');
    res.json(response);

  } catch (error) {
    console.error('Basic stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch basic stats',
      details: error.message 
    });
  }
};

// Phase 1: Detailed Stats Endpoint (SLOWER - 3-5 seconds)
exports.getDetailedStats = async (req, res) => {
  try {
    console.log('Detailed stats request received:', req.query);
    const { timeFilter = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(timeFilter);

    // Check cache first
    const cacheKey = `detailed:${timeFilter}`;
    if (dashboardCache.has(cacheKey)) {
      const cachedData = dashboardCache.get(cacheKey);
      // Return cached data if it's less than 2 minutes old
      if (Date.now() - cachedData.timestamp < 2 * 60 * 1000) {
        console.log('Returning cached detailed stats');
        return res.json(cachedData.data);
      }
    }

    console.log('Date range:', { startDate, endDate });
    
    // Debug: Check if we have any payments in the date range
    const paymentCount = await Payment.count({
      where: { createdAt: { [Op.between]: [startDate, endDate] } }
    });
    console.log('💰 Payment count in date range:', paymentCount);
    
    // Debug: Check the actual date values
    console.log('🔍 Date debugging:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateType: typeof startDate,
      endDateType: typeof endDate,
      timeFilter
    });

    // Execute multiple queries in parallel
    const [
      recentInvoices,
      recentPayments,
      recentCustomers,
      topProducts,
      topCustomers,
      overdueInvoices
    ] = await Promise.all([
      // Recent invoices (limit to what's needed)
      Invoice.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
        attributes: ["id", "status", "createdAt", "total"],
        include: [{ 
          model: Customer, 
          as: "Customer",
          attributes: ["name"],
          required: true 
        }]
      }),
      
      // Recent payments
      Payment.findAll({
        order: [["createdAt", "DESC"]],
        limit: 3,
        attributes: ["id", "method", "amount", "createdAt"],
      }),
      
      // Recent customers
      Customer.findAll({
        order: [["createdAt", "DESC"]],
        limit: 2,
        attributes: ["id", "name", "createdAt"],
      }),
      
      // Top products by quantity sold
      InvoiceItem.findAll({
        attributes: [
          "productId", 
          [sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'totalSold']
        ],
        include: [{ 
          model: Product, 
          as: "Product",
          attributes: ["name"],
          required: true 
        }],
        where: timeFilter !== 'total' ? {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        } : {},
        group: ['InvoiceItem.productId', 'Product.id', 'Product.name'],
        order: [[sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'DESC']],
        limit: 5,
      }),
      
      // Top customers by invoice total
      Invoice.findAll({
        attributes: [
          "customerId", 
          [sequelize.fn('SUM', sequelize.col('Invoice.total')), 'totalSpent']
        ],
        include: [{ 
          model: Customer, 
          as: "Customer",
          attributes: ["name"],
          required: true 
        }],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['Invoice.customerId', 'Customer.id', 'Customer.name'],
        order: [[sequelize.fn('SUM', sequelize.col('Invoice.total')), 'DESC']],
        limit: 5,
      }),
      
      // Overdue invoices
      Invoice.findAll({
        where: { status: "overdue" },
        attributes: ["id", "total", "dueDate", "createdAt"],
        include: [{ 
          model: Customer, 
          as: "Customer",
          attributes: ["name"],
          required: true 
        }],
        order: [["dueDate", "ASC"]],
      })
    ]);

    // Combine and sort recent activities
    const allActivities = [
      ...recentInvoices.map((i) => ({
        type: 'invoice',
        id: i.id,
        text: `Invoice #${i.id} ${i.status} - $${i.total}`,
        customer: i.Customer?.name,
        date: i.createdAt,
        status: i.status
      })),
      ...recentPayments.map((p) => ({
        type: 'payment',
        id: p.id,
        text: `Payment #${p.id} $${p.amount} received`,
        method: p.method,
        date: p.createdAt,
        amount: p.amount
      })),
      ...recentCustomers.map((c) => ({
        type: 'customer',
        id: c.id,
        text: `New customer: ${c.name}`,
        name: c.name,
        date: c.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

    // Simplified chart data generation
    let chartData = [];
    try {
      if (timeFilter === 'day') {
        // For day view, just get the sum for the day, not hourly
        const dailyRevenue = await safeSum(Payment, "amount", {
          where: { createdAt: { [Op.between]: [startDate, endDate] } }
        });
        chartData = [{
          date: formatDateNicely(startDate),
          revenue: dailyRevenue
        }];
      } else if (timeFilter === 'week') {
        // For week, get 7 daily sums with a single query using PostgreSQL DATE_TRUNC
        const dailySums = await Payment.findAll({
          attributes: [
            [sequelize.fn('DATE_TRUNC', sequelize.literal("'day'"), sequelize.col('createdAt')), 'date'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'dailyRevenue']
          ],
                where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          group: [sequelize.fn('DATE_TRUNC', sequelize.literal("'day'"), sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE_TRUNC', sequelize.literal("'day'"), sequelize.col('createdAt')), 'ASC']]
        });
        
        chartData = dailySums.map(item => ({
          date: new Date(item.dataValues.date).toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: parseFloat(item.dataValues.dailyRevenue) || 0
        }));
      } else if (timeFilter === 'month') {
        // For month, get weekly sums using PostgreSQL EXTRACT
        const weeklySums = await Payment.findAll({
          attributes: [
            [sequelize.fn('EXTRACT', sequelize.literal("'week' FROM \"createdAt\"")), 'week'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'weeklyRevenue']
          ],
                where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          group: [sequelize.fn('EXTRACT', sequelize.literal("'week' FROM \"createdAt\""))],
          order: [[sequelize.fn('EXTRACT', sequelize.literal("'week' FROM \"createdAt\"")), 'ASC']]
        });
        
        chartData = weeklySums.map(item => ({
          date: `Week ${item.dataValues.week}`,
          revenue: parseFloat(item.dataValues.weeklyRevenue) || 0
        }));
      } else if (timeFilter === 'year') {
        // For year, get monthly sums using PostgreSQL EXTRACT
        const monthlySums = await Payment.findAll({
          attributes: [
            [sequelize.fn('EXTRACT', sequelize.literal("'month' FROM \"createdAt\"")), 'month'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'monthlyRevenue']
          ],
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          group: [sequelize.fn('EXTRACT', sequelize.literal("'month' FROM \"createdAt\""))],
          order: [[sequelize.fn('EXTRACT', sequelize.literal("'month' FROM \"createdAt\"")), 'ASC']]
        });
        
        // Create complete year data with all 12 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthDataMap = new Map();
        
        // Fill in existing data
        monthlySums.forEach(item => {
          monthDataMap.set(Math.floor(item.dataValues.month), parseFloat(item.dataValues.monthlyRevenue) || 0);
        });
        
        // Create complete year data
        chartData = monthNames.map((monthName, index) => ({
          date: monthName,
          revenue: monthDataMap.get(index + 1) || 0
        }));
      } else if (timeFilter === 'total') {
        // For total, get yearly sums and fill in missing years
        const yearlySums = await Payment.findAll({
          attributes: [
            [sequelize.fn('EXTRACT', sequelize.literal("'year' FROM \"createdAt\"")), 'year'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'yearlyRevenue']
          ],
          group: [sequelize.fn('EXTRACT', sequelize.literal("'year' FROM \"createdAt\""))],
          order: [[sequelize.fn('EXTRACT', sequelize.literal("'year' FROM \"createdAt\"")), 'ASC']]
        });
        
        // For total filter, dynamically show ALL years from earliest payment to current year
        const years = yearlySums.map(item => Math.floor(item.dataValues.year)).sort((a, b) => a - b);
        const minYear = years.length > 0 ? years[0] : new Date().getFullYear() - 2; // Fallback to 2 years back if no data
        const maxYear = new Date().getFullYear(); // Always include current year
        
        // Create complete year data with ALL years in range (dynamic growth)
        const yearDataMap = new Map();
        yearlySums.forEach(item => {
          yearDataMap.set(Math.floor(item.dataValues.year), parseFloat(item.dataValues.yearlyRevenue) || 0);
        });
        
        chartData = [];
        for (let year = minYear; year <= maxYear; year++) {
          chartData.push({
            date: year.toString(),
            revenue: yearDataMap.get(year) || 0
          });
        }
        console.log('📊 Total filter - Dynamic years range:', minYear, 'to', maxYear, 'Chart data:', chartData);
      }
      console.log('📊 Chart data generated:', chartData.length, 'points');
      
      // If chart data is empty, create fallback data
      if (chartData.length === 0) {
        console.log('⚠️  Chart data is empty, creating fallback data');
        if (timeFilter === 'month') {
          chartData = [
            { date: 'Week 1', revenue: 0 },
            { date: 'Week 2', revenue: 0 },
            { date: 'Week 3', revenue: 0 },
            { date: 'Week 4', revenue: 0 }
          ];
        } else if (timeFilter === 'week') {
          chartData = [
            { date: 'Mon', revenue: 0 },
            { date: 'Tue', revenue: 0 },
            { date: 'Wed', revenue: 0 },
            { date: 'Thu', revenue: 0 },
            { date: 'Fri', revenue: 0 },
            { date: 'Sat', revenue: 0 },
            { date: 'Sun', revenue: 0 }
          ];
        } else if (timeFilter === 'year') {
          chartData = [
            { date: 'Jan', revenue: 0 },
            { date: 'Feb', revenue: 0 },
            { date: 'Mar', revenue: 0 },
            { date: 'Apr', revenue: 0 },
            { date: 'May', revenue: 0 },
            { date: 'Jun', revenue: 0 },
            { date: 'Jul', revenue: 0 },
            { date: 'Aug', revenue: 0 },
            { date: 'Sep', revenue: 0 },
            { date: 'Oct', revenue: 0 },
            { date: 'Nov', revenue: 0 },
            { date: 'Dec', revenue: 0 }
          ];
        } else if (timeFilter === 'total') {
          // Dynamic fallback - show more years for better historical context
          const currentYear = new Date().getFullYear();
          chartData = [];
          // Show from 5 years back to current year for fallback
          for (let year = currentYear - 4; year <= currentYear; year++) {
            chartData.push({
              date: year.toString(),
              revenue: 0
            });
          }
        } else {
          chartData = [
            { date: 'No Data', revenue: 0 }
          ];
        }
        console.log('📈 Fallback chart data created:', chartData);
      }
      
                } catch (error) {
      console.error('❌ Error calculating chart data:', error);
      // Create fallback chart data
      chartData = [
        { date: 'Error', revenue: 0 }
      ];
    }

    // Process top products
    const processedTopProducts = topProducts.map(item => ({
      name: item.Product?.name || 'Unknown Product',
      sold: parseInt(item.dataValues.totalSold) || 0
    }));

    // Process top customers
    const processedTopCustomers = topCustomers.map(invoice => ({
      name: invoice.Customer?.name || 'Unknown Customer',
      spent: parseFloat(invoice.dataValues.totalSpent) || 0
    }));

    const response = {
      timeFilter,
      recentActivity: allActivities,
      chartData,
      topProducts: processedTopProducts,
      topCustomers: processedTopCustomers,
      overdueInvoices,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    // Cache the result
    dashboardCache.set(cacheKey, {
      timestamp: Date.now(),
      data: response
    });

    console.log('Detailed stats response prepared successfully');
    res.json(response);

                } catch (error) {
    console.error('Detailed stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch detailed stats',
      details: error.message 
    });
  }
};

// Legacy endpoint - kept for backward compatibility but optimized
exports.getStats = async (req, res) => {
  try {
    console.log('Legacy dashboard request received:', req.query);
    const { timeFilter = 'month' } = req.query;
    
    // Check cache first
    const cacheKey = `legacy:${timeFilter}`;
    if (dashboardCache.has(cacheKey)) {
      const cachedData = dashboardCache.get(cacheKey);
      // Return cached data if it's less than 2 minutes old
      if (Date.now() - cachedData.timestamp < 2 * 60 * 1000) {
        console.log('Returning cached legacy dashboard data');
        return res.json(cachedData.data);
      }
    }

    const { startDate, endDate } = getDateRange(timeFilter);

    console.log('Date range:', { startDate, endDate });
    if (timeFilter === 'total') {
      console.log('📊 Processing TOTAL time filter - showing all-time data');
    }

    // Execute multiple queries in parallel instead of sequentially
    const [
      totalRevenue,
      totalExpenses,
      invoiceCounts,
      newCustomers,
      lowStock,
      recentInvoices,
      recentPayments,
      recentCustomers,
      topProducts,
      topCustomers,
      overdueInvoices
    ] = await Promise.all([
      // Total Revenue
      safeSum(Payment, "amount", {
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      }),
      
      // Total Expenses
      safeSum(Expense, "amount", {
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      }),
      
      // Invoice counts (all in one query)
      Invoice.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { createdAt: { [Op.between]: [startDate, endDate] } },
        group: ['status']
      }),
      
      // New customers
      Customer.count({
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      }),
      
      // Low stock items
      Inventory.count({
        where: { quantity: { [Op.lte]: sequelize.col('reorderLevel') } }
      }),
      
      // Recent invoices (limit to what's needed)
      Invoice.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
        attributes: ["id", "status", "createdAt", "total"],
        include: [{ 
          model: Customer, 
          as: "Customer",
          attributes: ["name"],
          required: true 
        }]
      }),
      
      // Recent payments
      Payment.findAll({
        order: [["createdAt", "DESC"]],
        limit: 3,
        attributes: ["id", "method", "amount", "createdAt"],
      }),
      
      // Recent customers
      Customer.findAll({
        order: [["createdAt", "DESC"]],
        limit: 2,
        attributes: ["id", "name", "createdAt"],
      }),
      
      // Top products by quantity sold
      InvoiceItem.findAll({
        attributes: [
          "productId", 
          [sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'totalSold']
        ],
        include: [{ 
          model: Product, 
          as: "Product",
          attributes: ["name"],
          required: true 
        }],
        where: timeFilter !== 'total' ? {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        } : {},
        group: ['InvoiceItem.productId', 'Product.id', 'Product.name'],
        order: [[sequelize.fn('SUM', sequelize.col('InvoiceItem.quantity')), 'DESC']],
        limit: 5,
      }),
      
      // Top customers by invoice total
      Invoice.findAll({
        attributes: [
          "customerId", 
          [sequelize.fn('SUM', sequelize.col('Invoice.total')), 'totalSpent']
        ],
        include: [{ 
          model: Customer, 
          as: "Customer",
          attributes: ["name"],
          required: true 
        }],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['Invoice.customerId', 'Customer.id', 'Customer.name'],
        order: [[sequelize.fn('SUM', sequelize.col('Invoice.total')), 'DESC']],
        limit: 5,
      }),

    // Overdue invoices
      Invoice.findAll({
        where: { status: "overdue" },
        attributes: ["id", "total", "dueDate", "createdAt"],
        include: [{ 
          model: Customer, 
          as: "Customer",
          attributes: ["name"],
          required: true 
        }],
        order: [["dueDate", "ASC"]],
      })
    ]);

    // Process invoice counts
    const paid = parseInt(invoiceCounts.find(i => i.status === 'paid')?.count || 0);
    const unpaid = parseInt(invoiceCounts.find(i => i.status === 'pending')?.count || 0);
    const overdue = parseInt(invoiceCounts.find(i => i.status === 'overdue')?.count || 0);
    const totalInvoices = paid + unpaid + overdue;
    const totalInvoicesOverall = await Invoice.count() || 0;

    // Combine and sort recent activities
    const allActivities = [
      ...recentInvoices.map((i) => ({
        type: 'invoice',
        id: i.id,
        text: `Invoice #${i.id} ${i.status} - $${i.total}`,
        customer: i.Customer?.name,
        date: i.createdAt,
        status: i.status
      })),
      ...recentPayments.map((p) => ({
        type: 'payment',
        id: p.id,
        text: `Payment #${p.id} $${p.amount} received`,
        method: p.method,
        date: p.createdAt,
        amount: p.amount
      })),
      ...recentCustomers.map((c) => ({
        type: 'customer',
        id: c.id,
        text: `New customer: ${c.name}`,
        name: c.name,
        date: c.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

    // Simplified chart data generation (same as detailed endpoint)
    let chartData = [];
    try {
      if (timeFilter === 'day') {
        const dailyRevenue = await safeSum(Payment, "amount", {
          where: { createdAt: { [Op.between]: [startDate, endDate] } }
        });
        chartData = [{
          date: formatDateNicely(startDate),
          revenue: dailyRevenue
        }];
      } else if (timeFilter === 'week') {
        const dailySums = await Payment.findAll({
          attributes: [
            [sequelize.fn('DATE_TRUNC', sequelize.literal("'day'"), sequelize.col('createdAt')), 'date'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'dailyRevenue']
          ],
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          group: [sequelize.fn('DATE_TRUNC', sequelize.literal("'day'"), sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE_TRUNC', sequelize.literal("'day'"), sequelize.col('createdAt')), 'ASC']]
        });
        
        chartData = dailySums.map(item => ({
          date: new Date(item.dataValues.date).toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: parseFloat(item.dataValues.dailyRevenue) || 0
        }));
      } else if (timeFilter === 'month') {
        const weeklySums = await Payment.findAll({
          attributes: [
            [sequelize.fn('EXTRACT', sequelize.literal("'week' FROM \"createdAt\"")), 'week'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'weeklyRevenue']
          ],
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          group: [sequelize.fn('EXTRACT', sequelize.literal("'week' FROM \"createdAt\""))],
          order: [[sequelize.fn('EXTRACT', sequelize.literal("'week' FROM \"createdAt\"")), 'ASC']]
        });
        
        chartData = weeklySums.map(item => ({
          date: `Week ${Math.floor(item.dataValues.week)}`,
          revenue: parseFloat(item.dataValues.weeklyRevenue) || 0
        }));
      } else if (timeFilter === 'year') {
        const monthlySums = await Payment.findAll({
          attributes: [
            [sequelize.fn('EXTRACT', sequelize.literal("'month' FROM \"createdAt\"")), 'month'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'monthlyRevenue']
          ],
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          group: [sequelize.fn('EXTRACT', sequelize.literal("'month' FROM \"createdAt\""))],
          order: [[sequelize.fn('EXTRACT', sequelize.literal("'month' FROM \"createdAt\"")), 'ASC']]
        });
        
        // Create complete year data with all 12 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthDataMap = new Map();
        
        // Fill in existing data
        monthlySums.forEach(item => {
          monthDataMap.set(Math.floor(item.dataValues.month), parseFloat(item.dataValues.monthlyRevenue) || 0);
        });
        
        // Create complete year data
        chartData = monthNames.map((monthName, index) => ({
          date: monthName,
          revenue: monthDataMap.get(index + 1) || 0
        }));
      } else if (timeFilter === 'total') {
        // For total, get yearly sums and fill in missing years
        const yearlySums = await Payment.findAll({
          attributes: [
            [sequelize.fn('EXTRACT', sequelize.literal("'year' FROM \"createdAt\"")), 'year'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'yearlyRevenue']
          ],
          group: [sequelize.fn('EXTRACT', sequelize.literal("'year' FROM \"createdAt\""))],
          order: [[sequelize.fn('EXTRACT', sequelize.literal("'year' FROM \"createdAt\"")), 'ASC']]
        });
        
        // For total filter, dynamically show ALL years from earliest payment to current year
        const years = yearlySums.map(item => Math.floor(item.dataValues.year)).sort((a, b) => a - b);
        const minYear = years.length > 0 ? years[0] : new Date().getFullYear() - 2; // Fallback to 2 years back if no data
        const maxYear = new Date().getFullYear(); // Always include current year
        
        // Create complete year data with ALL years in range (dynamic growth)
        const yearDataMap = new Map();
        yearlySums.forEach(item => {
          yearDataMap.set(Math.floor(item.dataValues.year), parseFloat(item.dataValues.yearlyRevenue) || 0);
        });
        
        chartData = [];
        for (let year = minYear; year <= maxYear; year++) {
          chartData.push({
            date: year.toString(),
            revenue: yearDataMap.get(year) || 0
          });
        }
        console.log('📊 Total filter - Dynamic years range:', minYear, 'to', maxYear, 'Chart data:', chartData);
      }
      console.log('Simplified chart data calculated successfully:', chartData.length, 'points');
    } catch (error) {
      console.error('Error calculating simplified chart data:', error);
      chartData = [];
    }

    // Process top products
    const processedTopProducts = topProducts.map(item => ({
      name: item.Product?.name || 'Unknown Product',
      sold: parseInt(item.dataValues.totalSold) || 0
    }));

    // Process top customers
    const processedTopCustomers = topCustomers.map(invoice => ({
      name: invoice.Customer?.name || 'Unknown Customer',
      spent: parseFloat(invoice.dataValues.totalSpent) || 0
    }));

    // Format the response to match frontend expectations
    const response = {
      timeFilter,
      totalRevenue,
      totalExpenses,
      invoiceStats: { paid, unpaid, overdue, totalInvoices, totalInvoicesOverall },
      newCustomers,
      lowStock,
      recentActivity: allActivities,
      chartData,
      topProducts: processedTopProducts,
      topCustomers: processedTopCustomers,
      overdueInvoices,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    // Cache the result
    dashboardCache.set(cacheKey, {
      timestamp: Date.now(),
      data: response
    });

    console.log('Legacy dashboard response prepared successfully');
    res.json(response);

  } catch (error) {
    console.error('Legacy dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    });
  }
};
