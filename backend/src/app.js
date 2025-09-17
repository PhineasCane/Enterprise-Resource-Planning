const express = require("express");
const path = require("path");
const cors = require("cors");
const { sequelize } = require("./models");

const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const customerRoutes = require("./routes/customer.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const paymentRoutes = require("./routes/payment.routes");
const productRoutes = require("./routes/product.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const expenseRoutes = require("./routes/expense.routes");
const reportRoutes = require("./routes/report.routes");
const settingRoutes = require("./routes/setting.routes");
const currencyRoutes = require("./routes/currency.routes");
const healthRoutes = require("./routes/health.routes");
const pdfRoutes = require("./routes/pdf.routes");
const businessProfileRoutes = require("./routes/businessProfile.routes");
const userRoutes = require("./routes/user.routes");
const contactDetailRoutes = require("./routes/contactDetail.routes");
const paymentDetailRoutes = require("./routes/paymentDetail.routes");
const excelRoutes = require("./routes/excel.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Connection keep-alive middleware
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route mounting
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/business-profile", businessProfileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact-details", contactDetailRoutes);
app.use("/api/payment-details", paymentDetailRoutes);
app.use("/api/excel", excelRoutes);
app.use("/api/health", healthRoutes);

// Global error handler (catches async errors too in Express 5)
app.use(errorHandler);

module.exports = app;
