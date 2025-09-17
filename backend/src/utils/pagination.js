/**
 * @param {number} page
 * @param {number} pageSize
 * @returns {limit, offset}
 */
function getPagination(page = 1, pageSize = 10) {
  const limit = +pageSize;
  const offset = (page - 1) * limit;
  return { limit, offset };
}

/**
 * @param {{ rows, count }} data
 * @param {number} page
 * @param {number} pageSize
 */
function getPagingData(data, page, pageSize) {
  const { count: total, rows: items } = data;
  return { items, total, page, pageSize };
}

module.exports = { getPagination, getPagingData };
