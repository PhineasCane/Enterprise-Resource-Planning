const { Product, Inventory } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");
const InventoryService = require("../services/inventory.service");

// GET /api/products
exports.fetchProducts = async (req, res) => {
  const { page = 1, pageSize = 10, search = "" } = req.query;
  const where = search
    ? { 
        [require("sequelize").Op.or]: [
          { name: { [require("sequelize").Op.like]: `%${search}%` } },
          { description: { [require("sequelize").Op.like]: `%${search}%` } },
          { id: search }
        ]
      }
    : {};
  const { limit, offset } = getPagination(page, pageSize);

  const data = await Product.findAndCountAll({
    where,
    limit,
    offset,
    order: [["name", "ASC"]],
    include: [
      { 
        model: Inventory, 
        as: 'inventory',
        attributes: ['quantity', 'reorderLevel', 'lastUpdated'],
        required: false
      }
    ]
  });

  // Transform the data to include inventory information
  const transformedRows = data.rows.map(product => {
    const productData = product.get();
    const inventoryData = product.inventory ? product.inventory.get() : null;
    const quantity = inventoryData ? parseInt(inventoryData.quantity) || 0 : 0;
    const pricePer = parseFloat(productData.pricePer) || 0;
    const totalPrice = quantity * pricePer;
    
    return {
      ...productData,
      quantity: quantity,
      totalPrice: totalPrice,
      reorderLevel: inventoryData ? inventoryData.reorderLevel : 5,
      lastUpdated: inventoryData ? inventoryData.lastUpdated : null,
      isLowStock: quantity <= (inventoryData ? inventoryData.reorderLevel : 5)
    };
  });

  res.json(getPagingData({ ...data, rows: transformedRows }, +page, +pageSize));
};

// GET /api/products/:id
exports.getProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      { 
        model: Inventory, 
        as: 'inventory',
        attributes: ['quantity', 'reorderLevel', 'lastUpdated'],
        required: false
      }
    ]
  });
  
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const productData = product.get();
  const inventoryData = product.inventory ? product.inventory.get() : null;
  const quantity = inventoryData ? parseInt(inventoryData.quantity) || 0 : 0;
  const pricePer = parseFloat(productData.pricePer) || 0;
  const totalPrice = quantity * pricePer;
  
  const transformedProduct = {
    ...productData,
    quantity: quantity,
    totalPrice: totalPrice,
    reorderLevel: inventoryData ? inventoryData.reorderLevel : 5,
    lastUpdated: inventoryData ? inventoryData.lastUpdated : null,
    isLowStock: quantity <= (inventoryData ? inventoryData.reorderLevel : 5)
  };

  res.json(transformedProduct);
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, description, pricePer, status } = req.body;

    // Validate required fields
    if (!name || !pricePer) {
      return res.status(400).json({ 
        message: "Missing required fields: name and pricePer are required" 
      });
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      pricePer,
      status: status || 'active'
    });

    // Create initial inventory record with 0 quantity
    await InventoryService.getOrCreateInventory(product.id, product.name);

    // Fetch the complete product with inventory
    const fullProduct = await Product.findByPk(product.id, {
      include: [
        { 
          model: Inventory, 
          as: 'inventory',
          attributes: ['quantity', 'reorderLevel', 'lastUpdated'],
          required: false
        }
      ]
    });

    // Transform the data manually instead of calling toJSON() which might fail
    const productData = fullProduct.get();
    const inventoryData = fullProduct.inventory ? fullProduct.inventory.get() : null;
    
    const transformedProduct = {
      ...productData,
      quantity: inventoryData ? parseInt(inventoryData.quantity) || 0 : 0,
      totalPrice: (inventoryData ? parseInt(inventoryData.quantity) || 0 : 0) * parseFloat(productData.pricePer || 0),
      reorderLevel: inventoryData ? inventoryData.reorderLevel : 5,
      lastUpdated: inventoryData ? inventoryData.lastUpdated : null,
      isLowStock: (inventoryData ? parseInt(inventoryData.quantity) || 0 : 0) <= (inventoryData ? inventoryData.reorderLevel : 5)
    };

    res.status(201).json(transformedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: "Error creating product", error: error.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, pricePer, status } = req.body;
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product
    await product.update({
      name,
      description,
      pricePer,
      status
    });

    // Update product name in inventory if it changed
    if (name && name !== product.name) {
      const inventory = await Inventory.findOne({ where: { productId: product.id } });
      if (inventory) {
        await inventory.update({ productName: name });
      }
    }

    // Fetch the complete product with inventory
    const fullProduct = await Product.findByPk(product.id, {
      include: [
        { 
          model: Inventory, 
          as: 'inventory',
          attributes: ['quantity', 'reorderLevel', 'lastUpdated'],
          required: false
        }
      ]
    });

    // Transform the data manually instead of calling toJSON() which might fail
    const productData = fullProduct.get();
    const inventoryData = fullProduct.inventory ? fullProduct.inventory.get() : null;
    
    const transformedProduct = {
      ...productData,
      quantity: inventoryData ? parseInt(inventoryData.quantity) || 0 : 0,
      totalPrice: (inventoryData ? parseInt(inventoryData.quantity) || 0 : 0) * parseFloat(productData.pricePer || 0),
      reorderLevel: inventoryData ? inventoryData.reorderLevel : 5,
      lastUpdated: inventoryData ? inventoryData.lastUpdated : null,
      isLowStock: (inventoryData ? parseInt(inventoryData.quantity) || 0 : 0) <= (inventoryData ? inventoryData.reorderLevel : 5)
    };

    res.json(transformedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product has inventory
    const inventory = await Inventory.findOne({ where: { productId: product.id } });
    if (inventory && inventory.quantity > 0) {
      return res.status(400).json({ 
        message: "Cannot delete product with existing stock. Please clear inventory first." 
      });
    }

    // Delete inventory record first
    if (inventory) {
      await inventory.destroy();
    }

    // Delete product
    await product.destroy();
    
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};
