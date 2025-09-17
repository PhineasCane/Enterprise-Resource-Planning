const {
  Payment,
  Expense,
  Invoice,
  InvoiceItem,
  Customer,
  Product,
} = require("../models");
const { fn, col, literal, Op } = require("sequelize");

// Test endpoint to verify the controller is working
exports.testReports = async (req, res) => {
  res.json({ 
    message: "Reports controller is working!", 
    timestamp: new Date().toISOString() 
  });
};

// GET /api/reports
exports.getReports = async (req, res) => {
  try {
    // revenue vs expenses
    const revenue = await Payment.sum("amount") || 0;
    const expenses = await Expense.sum("amount") || 0;

    // paid vs unpaid invoices
    const paidCount = await Invoice.count({ where: { status: "paid" } }) || 0;
    const unpaidCount = await Invoice.count({ where: { status: "pending" } }) || 0;

    // top-selling products - Simplified approach
    let topProducts = [];
    try {
      const productSales = await InvoiceItem.findAll({
        attributes: [
          "productId", 
          [fn("sum", col("quantity")), "sold"]
        ],
        group: ["productId"],
        order: [[literal("sold"), "DESC"]],
        limit: 5,
        raw: true
      });

      // Get product names separately to avoid GROUP BY issues
      if (productSales.length > 0) {
        const productIds = productSales.map(item => item.productId);
        const products = await Product.findAll({
          where: { id: { [Op.in]: productIds } },
          attributes: ["id", "name"],
          raw: true
        });

        // Combine the data
        topProducts = productSales.map(sale => {
          const product = products.find(p => p.id === sale.productId);
          return {
            productId: sale.productId,
            sold: parseInt(sale.sold),
            name: product ? product.name : "Unknown Product"
          };
        });
      }
    } catch (productError) {
      console.log("⚠️ Could not fetch top products:", productError.message);
      topProducts = [];
    }

    console.log(`🏆 Top products: ${topProducts.length} found`);

    // customer revenue ranking - Simplified approach
    let customerRevenue = [];
    try {
      const customerSales = await Invoice.findAll({
        attributes: [
          "customerId", 
          [fn("sum", col("total")), "totalSpent"]
        ],
        group: ["customerId"],
        order: [[literal("totalSpent"), "DESC"]],
        limit: 5,
        raw: true
      });

      // Get customer names separately
      if (customerSales.length > 0) {
        const customerIds = customerSales.map(item => item.customerId);
        const customers = await Customer.findAll({
          where: { id: { [Op.in]: customerIds } },
          attributes: ["id", "name"],
          raw: true
        });

        // Combine the data
        customerRevenue = customerSales.map(sale => {
          const customer = customers.find(c => c.id === sale.customerId);
          return {
            customerId: sale.customerId,
            totalSpent: parseFloat(sale.totalSpent),
            name: customer ? customer.name : "Unknown Customer"
          };
        });
      }
    } catch (customerError) {
      console.log("⚠️ Could not fetch customer revenue:", customerError.message);
      customerRevenue = [];
    }

    console.log(`👥 Customer revenue: ${customerRevenue.length} found`);

    // expense breakdown by category
    let expenseBreakdown = [];
    try {
      expenseBreakdown = await Expense.findAll({
        attributes: [
          "category", 
          [fn("sum", col("amount")), "total"]
        ],
        group: ["category"],
        where: {
          category: { [Op.ne]: null }
        },
        raw: true
      });
    } catch (expenseError) {
      console.log("⚠️ Could not fetch expense breakdown:", expenseError.message);
      expenseBreakdown = [];
    }

    console.log(`💸 Expense breakdown: ${expenseBreakdown.length} categories`);

    // outstanding payments - Simplified
    let outstanding = [];
    try {
      const unpaidInvoices = await Invoice.findAll({
        where: {
          status: { [Op.in]: ["pending", "overdue"] }
        },
        attributes: ["id", "total", "status"],
        limit: 5,
        raw: true
      });

      // Calculate outstanding amounts
      outstanding = await Promise.all(
        unpaidInvoices.map(async (invoice) => {
          const payments = await Payment.sum("amount", {
            where: { invoiceId: invoice.id }
          }) || 0;
          return {
            id: invoice.id,
            outstanding: Math.max(0, invoice.total - payments),
            status: invoice.status
          };
        })
      );
    } catch (outstandingError) {
      console.log("⚠️ Could not fetch outstanding payments:", outstandingError.message);
      outstanding = [];
    }

    const reportData = {
      revenueVsExpenses: { revenue, expenses },
      invoiceStatus: { paid: paidCount, unpaid: unpaidCount },
      topProducts,
      customerRevenue,
      expenseBreakdown,
      outstanding,
    };

    res.json(reportData);

  } catch (error) {
    console.error("❌ Reports error:", error);
    res.status(500).json({ 
      message: "Failed to generate reports", 
      error: error.message 
    });
  }
};
