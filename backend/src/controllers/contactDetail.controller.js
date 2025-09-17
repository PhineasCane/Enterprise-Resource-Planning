const { ContactDetail } = require("../models");

exports.list = async (req, res) => {
  const rows = await ContactDetail.findAll({ order: [["id", "DESC"]] });
  res.json(rows);
};

exports.create = async (req, res) => {
  const created = await ContactDetail.create(req.body);
  res.status(201).json(created);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const row = await ContactDetail.findByPk(id);
  if (!row) return res.status(404).json({ message: "Not found" });
  await row.update(req.body);
  res.json(row);
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const row = await ContactDetail.findByPk(id);
  if (!row) return res.status(404).json({ message: "Not found" });
  await row.destroy();
  res.status(204).end();
};


