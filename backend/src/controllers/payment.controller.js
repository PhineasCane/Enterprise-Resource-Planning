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

// POST /api/payments
exports.createPayment = async (req, res) => {
  const payment = await Payment.create(req.body);
  
  // Fetch the created payment with customer information
  const createdPayment = await Payment.findByPk(payment.id, {
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

  // Transform the data to flatten customer information
  const transformedPayment = {
    ...createdPayment.toJSON(),
    Customer: createdPayment.Invoice?.Customer || null
  };

  res.status(201).json(transformedPayment);
};

// PUT /api/payments/:id
exports.updatePayment = async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }
  await payment.update(req.body);
  
  // Fetch the updated payment with customer information
  const updatedPayment = await Payment.findByPk(id, {
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

  // Transform the data to flatten customer information
  const transformedPayment = {
    ...updatedPayment.toJSON(),
    Customer: updatedPayment.Invoice?.Customer || null
  };

  res.json(transformedPayment);
};

// DELETE /api/payments/:id
exports.deletePayment = async (req, res) => {
  const { id } = req.params;
  const deleted = await Payment.destroy({ where: { id } });
  if (!deleted) {
    return res.status(404).json({ message: "Payment not found" });
  }
  res.status(204).send();
};
