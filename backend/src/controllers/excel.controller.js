const { Customer, Invoice, Payment, InvoiceItem } = require("../models");
const { generateCustomersExcel, generateInvoicesExcel } = require("../services/excel.generator");

exports.exportCustomersToExcel = async (req, res) => {
  try {
    console.log('🔍 Starting Excel export...');
    
    // Fetch customers with their invoice data using associations
    const customers = await Customer.findAll({
      include: [
        {
          model: Invoice,
          as: 'invoices',
          attributes: ['id', 'total', 'status'],
          include: [
            {
              model: Payment,
              as: 'payments',
              attributes: ['amount']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 Found ${customers.length} customers with invoice data`);
    
    if (!customers || customers.length === 0) {
      console.log('⚠️ No customers found, creating sample data for testing');
      // Create sample data for testing
      const sampleCustomers = [{
        id: 1,
        name: 'Sample Customer',
        email: 'sample@example.com',
        phone: '+1234567890',
        address: '123 Sample St',
        country: 'Sample Country',
        createdAt: new Date(),
        totalInvoices: 0,
        totalRevenue: '0.00',
        status: 'Active'
      }];
      
      const excelBuffer = await generateCustomersExcel(sampleCustomers);
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=customers-export-${new Date().toISOString().split('T')[0]}.xlsx`,
        'Content-Length': excelBuffer.length
      });
      
      return res.send(excelBuffer);
    }

    // Process customer data with real invoice calculations
    const processedCustomers = customers.map(customer => {
      const customerData = customer.toJSON();
      
      // Calculate total invoices
      const totalInvoices = customer.invoices?.length || 0;
      
      // Calculate total revenue from paid invoices
      const totalRevenue = customer.invoices?.reduce((sum, invoice) => {
        if (invoice.status === 'paid') {
          return sum + parseFloat(invoice.total || 0);
        }
        return sum;
      }, 0) || 0;

      console.log(`📊 Customer ${customer.name}: ${totalInvoices} invoices, $${totalRevenue.toFixed(2)} revenue`);

      return {
        ...customerData,
        totalInvoices,
        totalRevenue: totalRevenue.toFixed(2),
        status: 'Active'
      };
    });

    console.log('📝 Processed customers with real data:', processedCustomers.length);

    // Generate Excel file
    console.log('🔨 Generating Excel file...');
    const excelBuffer = await generateCustomersExcel(processedCustomers);
    console.log('✅ Excel file generated, size:', excelBuffer.length);

    // Set response headers for file download
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=customers-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      'Content-Length': excelBuffer.length
    });

    // Send the Excel file
    console.log('📤 Sending Excel file...');
    res.send(excelBuffer);

  } catch (error) {
    console.error('❌ Error exporting customers to Excel:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Send a more detailed error response
    res.status(500).json({ 
      message: "Failed to export customers to Excel", 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};

exports.exportInvoicesToExcel = async (req, res) => {
  try {
    console.log('🔍 Starting Invoice Excel export...');
    
    // Fetch invoices with customer data
    const invoices = await Invoice.findAll({
      include: [
        { 
          model: Customer, 
          as: "Customer", 
          attributes: ["name", "email", "phone"] 
        },
        { 
          model: InvoiceItem, 
          as: "items", 
          attributes: ["id"] 
        }
      ],
      order: [["date", "DESC"]]
    });
    
    console.log(`📊 Found ${invoices.length} invoices with customer data`);
    
    if (!invoices || invoices.length === 0) {
      console.log('⚠️ No invoices found, creating sample data for testing');
      // Create sample data for testing
      const sampleInvoices = [{
        id: 1,
        number: 'INV-001',
        date: new Date(),
        dueDate: new Date(),
        customerName: 'Sample Customer',
        customerEmail: 'sample@example.com',
        customerPhone: '+1234567890',
        status: 'DRAFT',
        itemsCount: 0,
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        total: 0,
        notes: 'Sample invoice',
        createdAt: new Date()
      }];
      
      const excelBuffer = await generateInvoicesExcel(sampleInvoices);
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=invoices-export-${new Date().toISOString().split('T')[0]}.xlsx`,
        'Content-Length': excelBuffer.length
      });
      
      return res.send(excelBuffer);
    }

    // Process invoice data
    const processedInvoices = invoices.map(invoice => {
      const invoiceData = invoice.toJSON();
      
      // Calculate items count
      const itemsCount = invoice.items?.length || 0;

      console.log(`📊 Invoice ${invoice.number}: ${itemsCount} items, $${invoice.total} total`);

      return {
        ...invoiceData,
        customerName: invoice.Customer?.name || 'N/A',
        customerEmail: invoice.Customer?.email || 'N/A',
        customerPhone: invoice.Customer?.phone || 'N/A',
        itemsCount
      };
    });

    console.log('📝 Processed invoices with customer data:', processedInvoices.length);

    // Generate Excel file
    console.log('🔨 Generating Invoice Excel file...');
    const excelBuffer = await generateInvoicesExcel(processedInvoices);
    console.log('✅ Invoice Excel file generated, size:', excelBuffer.length);

    // Set response headers for file download
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=invoices-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      'Content-Length': excelBuffer.length
    });

    // Send the Excel file
    console.log('📤 Sending Invoice Excel file...');
    res.send(excelBuffer);

  } catch (error) {
    console.error('❌ Error exporting invoices to Excel:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Send a more detailed error response
    res.status(500).json({ 
      message: "Failed to export invoices to Excel", 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
