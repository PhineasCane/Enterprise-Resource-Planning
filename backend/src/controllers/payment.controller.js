const { Payment, Invoice, Customer } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");

// GET /api/payments
exports.fetchPayments = async (req, res) => {
  const { page = 1, pageSize = 10, search = "" } = req.query;
  const { limit, offset } = getPagination(page, pageSize);

  // Build search conditions
  let where = {};
  if (search) {
    where = {
      [Payment.sequelize.Op.or]: [
        { method: { [Payment.sequelize.Op.iLike]: `%${search}%` } },
        { '$Invoice.Customer.name$': { [Payment.sequelize.Op.iLike]: `%${search}%` } },
        { '$Invoice.Customer.email$': { [Payment.sequelize.Op.iLike]: `%${search}%` } }
      ]
    };
  }

  const data = await Payment.findAndCountAll({
    where,
    limit,
    offset,
    order: [["date", "DESC"]],
    include: [
      { 
        model: Invoice, 
        as: "Invoice",
        attributes: ["id", "total", "number"], 
        include: [{ 
          model: Customer, 
          as: "Customer",
          attributes: ["id", "name", "email", "phone"] 
        }] 
      },
    ],
  });

  // Transform the data to flatten customer information
  const transformedData = {
    ...data,
    rows: data.rows.map(payment => ({
      ...payment.toJSON(),
      Customer: payment.Invoice?.Customer || null
    }))
  };

  res.json(getPagingData(transformedData, +page, +pageSize));
};

// GET /api/payments/:id
exports.getPayment = async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, {
    include: [
      { 
        model: Invoice, 
        as: "Invoice",
        attributes: ["id", "total", "number"], 
        include: [{ 
          model: Customer, 
          as: "Customer",
          attributes: ["id", "name", "email", "phone"] 
        }] 
      }
    ],
  });
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  // Transform the data to flatten customer information
  const transformedPayment = {
    ...payment.toJSON(),
    Customer: payment.Invoice?.Customer || null
  };

  res.json(transformedPayment);
};

// Helper function to sync invoice payment status and paidAmount
const syncInvoicePaymentStatus = async (invoiceId) => {
  if (!invoiceId) return;
  try {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) return;

    const totalPaid = await Payment.sum("amount", { where: { invoiceId } }) || 0;
    const invoiceTotal = parseFloat(invoice.total) || 0;

    let newStatus = invoice.status;
    if (newStatus !== "cancelled") {
      if (totalPaid >= invoiceTotal && invoiceTotal > 0) {
        newStatus = "paid";
      } else if (totalPaid > 0) {
        newStatus = "pending";
      } else if (invoice.status === "paid") {
        newStatus = "pending";
      }
    }

    await invoice.update({
      paidAmount: totalPaid,
      status: newStatus
    });
  } catch (err) {
    console.error(`Failed to sync invoice ${invoiceId} payment status:`, err);
  }
};

// POST /api/payments
exports.createPayment = async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    
    // Sync invoice paidAmount and status
    if (payment.invoiceId) {
      await syncInvoicePaymentStatus(payment.invoiceId);
    }

    // Fetch the created payment with customer information
    const createdPayment = await Payment.findByPk(payment.id, {
      include: [
        { 
          model: Invoice, 
          as: "Invoice",
          attributes: ["id", "total", "number", "status", "paidAmount"], 
          include: [{ 
            model: Customer, 
            as: "Customer",
            attributes: ["id", "name", "email", "phone"] 
          }] 
        }
      ],
    });

    const transformedPayment = {
      ...createdPayment.toJSON(),
      Customer: createdPayment.Invoice?.Customer || null
    };

    res.status(201).json(transformedPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Error creating payment", error: error.message });
  }
};

// PUT /api/payments/:id
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const oldInvoiceId = payment.invoiceId;
    await payment.update(req.body);
    
    // Sync invoice paidAmount and status for old and new invoice if changed
    if (payment.invoiceId) {
      await syncInvoicePaymentStatus(payment.invoiceId);
    }
    if (oldInvoiceId && oldInvoiceId !== payment.invoiceId) {
      await syncInvoicePaymentStatus(oldInvoiceId);
    }

    // Fetch the updated payment with customer information
    const updatedPayment = await Payment.findByPk(id, {
      include: [
        { 
          model: Invoice, 
          as: "Invoice",
          attributes: ["id", "total", "number", "status", "paidAmount"], 
          include: [{ 
            model: Customer, 
            as: "Customer",
            attributes: ["id", "name", "email", "phone"] 
          }] 
        }
      ],
    });

    const transformedPayment = {
      ...updatedPayment.toJSON(),
      Customer: updatedPayment.Invoice?.Customer || null
    };

    res.json(transformedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Error updating payment", error: error.message });
  }
};

// DELETE /api/payments/:id
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const invoiceId = payment.invoiceId;
    const deleted = await Payment.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (invoiceId) {
      await syncInvoicePaymentStatus(invoiceId);
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: "Error deleting payment", error: error.message });
  }
};
