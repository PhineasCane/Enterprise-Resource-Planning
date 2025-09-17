const { Setting } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");

// GET /api/settings
exports.fetchSettings = async (req, res) => {
  const { page = 1, pageSize = 10, search = "" } = req.query;
  const where = search
    ? { key: { [Setting.sequelize.Op.iLike]: `%${search}%` } }
    : {};
  const { limit, offset } = getPagination(page, pageSize);
  const data = await Setting.findAndCountAll({
    where,
    limit,
    offset,
    order: [["key", "ASC"]],
  });
  res.json(getPagingData(data, +page, +pageSize));
};

// POST /api/settings
exports.createSetting = async (req, res) => {
  const setting = await Setting.create(req.body);
  res.status(201).json(setting);
};

// PUT /api/settings/:id
exports.updateSetting = async (req, res) => {
  const setting = await Setting.findByPk(req.params.id);
  if (!setting) {
    return res.status(404).json({ message: "Setting not found" });
  }
  await setting.update(req.body);
  res.json(setting);
};

// DELETE /api/settings/:id
exports.deleteSetting = async (req, res) => {
  const deleted = await Setting.destroy({ where: { id: req.params.id } });
  if (!deleted) {
    return res.status(404).json({ message: "Setting not found" });
  }
  res.status(204).send();
};
