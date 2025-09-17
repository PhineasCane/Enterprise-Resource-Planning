const { Customer, Invoice, Payment } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");

// GET /api/customers
exports.fetchCustomers = async (req, res) => {
  const { page = 1, pageSize = 10, search = "" } = req.query;
  const where = search
    ? { name: { [Customer.sequelize.Op.iLike]: `%${search}%` } }
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
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
};

// PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findByPk(id);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  await customer.update(req.body);
  res.json(customer);
};

// DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const deleted = await Customer.destroy({ where: { id } });
  if (!deleted) {
    return res.status(404).json({ message: "Customer not found" });
  }
  res.status(204).send();
};
