const { Customer, Invoice, Payment } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");

// GET /api/customers
exports.fetchCustomers = async (req, res) => {
  const { page = 1, pageSize = 10, search = "" } = req.query;
  const where = search
    ? {
        [Customer.sequelize.Op.or]: [
          { name: { [Customer.sequelize.Op.iLike]: `%${search}%` } },
          { email: { [Customer.sequelize.Op.iLike]: `%${search}%` } },
          { phone: { [Customer.sequelize.Op.iLike]: `%${search}%` } },
          { taxPin: { [Customer.sequelize.Op.iLike]: `%${search}%` } },
        ]
      }
    : {};
  const { limit, offset } = getPagination(page, pageSize);

  const data = await Customer.findAndCountAll({
    where,
    limit,
    offset,
    order: [["id", "DESC"]],
  });
  res.json(getPagingData(data, +page, +pageSize));
};

// GET /api/customers/:id
exports.getCustomer = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findByPk(id, {
    include: [{ 
      model: Invoice, 
      as: "invoices",
      include: [{ 
        model: Payment, 
        as: "payments" 
      }] 
    }],
  });
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  res.json(customer);
};

// POST /api/customers
exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(400).json({ message: error.message || "Failed to create customer" });
  }
};

// PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await customer.update(req.body);
    res.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(400).json({ message: error.message || "Failed to update customer" });
  }
};

// DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceCount = await Invoice.count({ where: { customerId: id } });
    if (invoiceCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete customer with ${invoiceCount} linked invoice(s). Mark customer as inactive instead.` 
      });
    }

    const deleted = await Customer.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Error deleting customer", error: error.message });
  }
};
