const { Expense } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");

// GET /api/expenses
exports.fetchExpenses = async (req, res) => {
  const { page = 1, pageSize = 10, search = "" } = req.query;
  const where = search
    ? { vendor: { [Expense.sequelize.Op.iLike]: `%${search}%` } }
    : {};
  const { limit, offset } = getPagination(page, pageSize);

  const data = await Expense.findAndCountAll({
    where,
    limit,
    offset,
    order: [["date", "DESC"]],
  });
  res.json(getPagingData(data, +page, +pageSize));
};

// GET /api/expenses/:id
exports.getExpense = async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }
  res.json(expense);
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
  const expense = await Expense.create(req.body);
  res.status(201).json(expense);
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findByPk(id);
  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }
  await expense.update(req.body);
  res.json(expense);
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  const { id } = req.params;
  const deleted = await Expense.destroy({ where: { id } });
  if (!deleted) {
    return res.status(404).json({ message: "Expense not found" });
  }
  res.status(204).send();
};
