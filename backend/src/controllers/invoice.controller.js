const { Invoice, InvoiceItem, Product, Customer } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");
const InventoryService = require("../services/inventory.service");

// Helper function to calculate invoice totals
const calculateInvoiceTotals = (items, taxRate = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.pricePer || 0);
    return sum + itemTotal;
  }, 0);
  
  const taxAmount = subtotal * (parseFloat(taxRate || 0) / 100);
  const total = subtotal + taxAmount;
  
  return { subtotal, taxAmount, total };
};

// Helper function to generate next invoice number
const generateNextInvoiceNumber = async () => {
  try {
    const lastInvoice = await Invoice.findOne({
      order: [['number', 'DESC']],
      attributes: ['number']
    });
    
    if (!lastInvoice) {
      return 'INV-001';
    }
    
    const lastNumber = lastInvoice.number;
    const match = lastNumber.match(/INV-(\d+)/);
    
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `INV-${nextNumber.toString().padStart(3, '0')}`;
    }
    
    return 'INV-001';
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return 'INV-001';
  }
};

// GET /api/invoices
exports.fetchInvoices = async (req, res) => {
  const { page = 1, pageSize = 10, search = "" } = req.query;
  const where = search
    ? { 
        [require("sequelize").Op.or]: [
          { number: { [require("sequelize").Op.like]: `%${search}%` } },
          { id: search }
        ]
      }
    : {};
  const { limit, offset } = getPagination(page, pageSize);

  const data = await Invoice.findAndCountAll({
    where,
    limit,
    offset,
    order: [["date", "DESC"]],
    include: [
      { model: Customer, as: "Customer", attributes: ["id", "name", "email", "address", "phone", "country"] },
      { 
        model: InvoiceItem, 
        as: 'items',
        include: [
          { model: Product, as: "Product", attributes: ["id", "name", "description", "pricePer"] }
        ]
      }
    ],
  });
  
  // Transform the data to include computed fields
  const transformedRows = data.rows.map(invoice => ({
    ...invoice.toJSON(),
    items: invoice.items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      // Computed fields from Product
      item: item.Product.name,
      description: item.Product.description,
      pricePer: item.Product.pricePer,
      total: item.quantity * item.Product.pricePer
    }))
  }));
  

  
  res.json(getPagingData({ ...data, rows: transformedRows }, +page, +pageSize));
};

// GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id, {
    include: [
      { model: Customer, as: "Customer", attributes: ["id", "name", "email", "address", "phone", "country"] },
      { 
        model: InvoiceItem, 
        as: 'items',
        include: [
          { model: Product, as: "Product", attributes: ["id", "name", "description", "pricePer"] }
        ]
      }
    ],
  });
  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  // Transform the data to include computed fields
  const transformedInvoice = {
    ...invoice.toJSON(),
    items: invoice.items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      // Computed fields from Product
      item: item.Product.name,
      description: item.Product.description,
      pricePer: item.Product.pricePer,
      total: item.quantity * item.Product.pricePer
    }))
  };

  res.json(transformedInvoice);
};

// POST /api/invoices
exports.createInvoice = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction();
  
  try {
    const { 
      customerId, 
      number, 
      year, 
      date, 
      dueDate, 
      status, 
      notes, 
      items, 
      taxRate 
    } = req.body;

    console.log('Received invoice data:', JSON.stringify(req.body, null, 2));
    console.log('Items data:', JSON.stringify(items, null, 2));

    // Validate required fields
    if (!customerId || !year || !date || !dueDate || !items || !Array.isArray(items)) {
      return res.status(400).json({ 
        message: "Missing required fields: customerId, year, date, dueDate, items" 
      });
    }

    // Validate that all products exist and get their current data
    const productIds = items.map(item => item.productId);
    const products = await Product.findAll({ where: { id: productIds } });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ 
        message: "One or more products not found" 
      });
    }

    // Check stock availability for all items
    for (const item of items) {
      const product = products.find(p => p.id === parseInt(item.productId));
      const requestedQuantity = parseInt(item.quantity) || 1;
      
      const hasStock = await InventoryService.hasSufficientStock(product.id, requestedQuantity);
      if (!hasStock) {
        const currentStock = await InventoryService.getCurrentStock(product.id);
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${requestedQuantity}` 
        });
      }
    }

    // Generate invoice number if not provided
    const invoiceNumber = number || await generateNextInvoiceNumber();

    // Calculate totals using current product data
    let subtotal = 0;
    const validatedItems = items.map(item => {
      const product = products.find(p => p.id === parseInt(item.productId));
      const quantity = parseInt(item.quantity) || 1;
      const pricePer = parseFloat(product.pricePer) || 0;
      const total = quantity * pricePer;
      subtotal += total;
      
      return {
        productId: parseInt(item.productId),
        quantity,
        pricePer,
        total
      };
    });

    const taxAmount = subtotal * (parseFloat(taxRate || 0) / 100);
    const total = subtotal + taxAmount;

    console.log('Calculated totals:', { subtotal, taxAmount, total });

    // Create invoice
    const invoice = await Invoice.create({
      customerId,
      number: invoiceNumber,
      year,
      date,
      dueDate,
      status: status || 'draft',
      notes,
      taxRate: taxRate || 0,
      subtotal,
      taxAmount,
      total
    }, { transaction });

    // Create invoice items and decrease inventory
    const invoiceItems = [];
    for (const item of items) {
      const product = products.find(p => p.id === parseInt(item.productId));
      const quantity = parseInt(item.quantity) || 1;
      
      // Create invoice item
      const invoiceItem = await InvoiceItem.create({
        invoiceId: invoice.id,
        productId: parseInt(item.productId),
        quantity
      }, { transaction });
      
      invoiceItems.push(invoiceItem);
      
      // Decrease inventory (Stock Out)
      await InventoryService.stockOut(
        product.id,
        product.name,
        quantity,
        'Invoice Sale',
        `Invoice #${invoiceNumber}`,
        `Sold ${quantity} units in invoice ${invoiceNumber}`
      );
    }

    console.log('Created invoice items and updated inventory:', JSON.stringify(invoiceItems, null, 2));

    // Fetch the complete invoice with computed data
    const fullInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { 
          model: InvoiceItem, 
          as: 'items',
          include: [
            { model: Product, as: "Product", attributes: ["id", "name", "description", "pricePer"] }
          ]
        },
        { model: Customer, as: "Customer", attributes: ["id", "name", "email", "address", "phone", "country"] }
      ],
      transaction
    });

    // Transform the data to include computed fields
    const transformedInvoice = {
      ...fullInvoice.toJSON(),
      items: fullInvoice.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        // Computed fields from Product
        item: item.Product.name,
        description: item.Product.description,
        pricePer: item.Product.pricePer,
        total: item.quantity * item.Product.pricePer
      }))
    };

    await transaction.commit();
    res.status(201).json(transformedInvoice);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: "Error creating invoice", error: error.message });
  }
};

// PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      customerId, 
      number, 
      year, 
      date, 
      dueDate, 
      status, 
      notes, 
      items, 
      taxRate 
    } = req.body;

    const invoice = await Invoice.findByPk(id, {
      include: [
        { 
          model: InvoiceItem, 
          as: 'items',
          include: [
            { model: Product, as: "Product", attributes: ["id", "name", "description", "pricePer"] }
          ]
        }
      ],
      transaction
    });
    
    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Store original items for inventory restoration
    const originalItems = invoice.items || [];

    // Calculate totals if items are provided
    let subtotal = 0, taxAmount = 0, total = 0;
    if (items && Array.isArray(items)) {
      // Validate that all products exist and get their current data
      const productIds = items.map(item => item.productId);
      const products = await Product.findAll({ where: { id: productIds }, transaction });
      
      if (products.length !== productIds.length) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: "One or more products not found" 
        });
      }

      // Check stock availability for all items
      for (const item of items) {
        const product = products.find(p => p.id === parseInt(item.productId));
        const requestedQuantity = parseInt(item.quantity) || 1;
        
        // Find original quantity for this product
        const originalItem = originalItems.find(oi => oi.productId === product.id);
        const originalQuantity = originalItem ? originalItem.quantity : 0;
        
        // Calculate net change in quantity
        const quantityChange = requestedQuantity - originalQuantity;
        
        if (quantityChange > 0) {
          // Need to check if we have enough stock for the increase
          const hasStock = await InventoryService.hasSufficientStock(product.id, quantityChange);
          if (!hasStock) {
            const currentStock = await InventoryService.getCurrentStock(product.id);
            await transaction.rollback();
            return res.status(400).json({ 
              message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Additional needed: ${quantityChange}` 
            });
          }
        }
      }

      // Calculate totals using current product data
      items.forEach(item => {
        const product = products.find(p => p.id === parseInt(item.productId));
        const quantity = parseInt(item.quantity) || 1;
        const pricePer = parseFloat(product.pricePer) || 0;
        subtotal += quantity * pricePer;
      });

      taxAmount = subtotal * (parseFloat(taxRate || 0) / 100);
      total = subtotal + taxAmount;
    }

    // Update invoice
    await invoice.update({
      customerId,
      number,
      year,
      date,
      dueDate,
      status,
      notes,
      taxRate,
      subtotal,
      taxAmount,
      total
    }, { transaction });

    // Update invoice items and adjust inventory if provided
    if (items && Array.isArray(items)) {
      // Process inventory adjustments for each item
      for (const item of items) {
        const productId = parseInt(item.productId);
        const newQuantity = parseInt(item.quantity) || 1;
        
        // Find original quantity for this product
        const originalItem = originalItems.find(oi => oi.productId === productId);
        const originalQuantity = originalItem ? originalItem.quantity : 0;
        
        // Calculate quantity change
        const quantityChange = newQuantity - originalQuantity;
        
        if (quantityChange !== 0) {
          const product = await Product.findByPk(productId, { transaction });
          
          if (quantityChange > 0) {
            // Quantity increased - decrease inventory (Stock Out)
            await InventoryService.stockOut(
              product.id,
              product.name,
              quantityChange,
              'Invoice Update - Quantity Increase',
              `Invoice #${invoice.number}`,
              `Increased quantity by ${quantityChange} units in invoice ${invoice.number}`
            );
          } else if (quantityChange < 0) {
            // Quantity decreased - increase inventory (Stock In)
            await InventoryService.stockIn(
              product.id,
              product.name,
              Math.abs(quantityChange),
              'Invoice Update - Quantity Decrease',
              `Invoice #${invoice.number}`,
              `Decreased quantity by ${Math.abs(quantityChange)} units in invoice ${invoice.number}`
            );
          }
        }
      }
      
      // Delete existing items
      await InvoiceItem.destroy({ where: { invoiceId: id }, transaction });
      
      // Create new items
      const invoiceItems = items.map((item) => ({
        invoiceId: id,
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity) || 1
      }));

      console.log('Updating invoice items:', JSON.stringify(invoiceItems, null, 2));
      await InvoiceItem.bulkCreate(invoiceItems, { transaction });
    }

    // Fetch the updated invoice with computed data
    const updatedInvoice = await Invoice.findByPk(id, {
      include: [
        { 
          model: InvoiceItem, 
          as: 'items',
          include: [
            { model: Product, as: "Product", attributes: ["id", "name", "description", "pricePer"] }
          ]
        },
        { model: Customer, as: "Customer", attributes: ["id", "name", "email", "address", "phone", "country"] }
      ],
      transaction
    });

    // Transform the data to include computed fields
    const transformedInvoice = {
      ...updatedInvoice.toJSON(),
      items: updatedInvoice.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        // Computed fields from Product
        item: item.Product.name,
        description: item.Product.description,
        pricePer: item.Product.pricePer,
        total: item.quantity * item.Product.pricePer
      }))
    };

    await transaction.commit();
    res.json(transformedInvoice);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: "Error updating invoice", error: error.message });
  }
};

// PATCH /api/invoices/:id - Update invoice status only
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update only the status
    await invoice.update({ status });

    // Fetch the updated invoice with computed data
    const updatedInvoice = await Invoice.findByPk(id, {
      include: [
        { 
          model: InvoiceItem, 
          as: 'items',
          include: [
            { model: Product, as: "Product", attributes: ["id", "name", "description", "pricePer"] }
          ]
        },
        { model: Customer, as: "Customer", attributes: ["id", "name", "email", "address", "phone", "country"] }
      ],
    });

    // Transform the data to include computed fields
    const transformedInvoice = {
      ...updatedInvoice.toJSON(),
      items: updatedInvoice.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        // Computed fields from Product
        item: item.Product.name,
        description: item.Product.description,
        pricePer: item.Product.pricePer,
        total: item.quantity * item.Product.pricePer
      }))
    };

    res.json(transformedInvoice);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: "Error updating invoice status", error: error.message });
  }
};

// DELETE /api/invoices/:id
exports.deleteInvoice = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Get the invoice with items before deletion for inventory restoration
    const invoice = await Invoice.findByPk(id, {
      include: [
        { 
          model: InvoiceItem, 
          as: 'items',
          include: [
            { model: Product, as: "Product", attributes: ["id", "name", "description", "pricePer"] }
          ]
        }
      ],
      transaction
    });
    
    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Restore inventory for all items in the invoice
    if (invoice.items && invoice.items.length > 0) {
      for (const item of invoice.items) {
        const product = item.Product;
        const quantity = item.quantity;
        
        // Restore inventory (Stock In)
        await InventoryService.stockIn(
          product.id,
          product.name,
          quantity,
          'Invoice Deletion - Stock Restoration',
          `Invoice #${invoice.number}`,
          `Restored ${quantity} units from deleted invoice ${invoice.number}`
        );
      }
      
      console.log(`Restored inventory for ${invoice.items.length} items from invoice #${invoice.number}`);
    }
    
    // Delete invoice items first (due to foreign key constraint)
    await InvoiceItem.destroy({ where: { invoiceId: id }, transaction });
    
    // Delete invoice
    const deleted = await Invoice.destroy({ where: { id }, transaction });
    if (!deleted) {
      await transaction.rollback();
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: "Error deleting invoice", error: error.message });
  }
};
