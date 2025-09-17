const ExcelJS = require('exceljs');

async function generateCustomersExcel(customers) {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Define columns
    worksheet.columns = [
      { header: 'Customer ID', key: 'id', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
      { header: 'Total Invoices', key: 'totalInvoices', width: 15 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    customers.forEach(customer => {
      worksheet.addRow({
        id: customer.id || '',
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        country: customer.country || '',
        createdAt: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '',
        totalInvoices: customer.totalInvoices || 0,
        totalRevenue: customer.totalRevenue || 0,
        status: customer.status || 'Active'
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 15);
    });

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
    
  } catch (error) {
    console.error('❌ Excel generator error:', error);
    throw error;
  }
}

async function generateInvoicesExcel(invoices) {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');

    // Define columns
    worksheet.columns = [
      { header: 'Invoice ID', key: 'id', width: 15 },
      { header: 'Invoice Number', key: 'number', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 30 },
      { header: 'Customer Email', key: 'customerEmail', width: 35 },
      { header: 'Customer Phone', key: 'customerPhone', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Items Count', key: 'itemsCount', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 20 },
      { header: 'Tax Rate', key: 'taxRate', width: 15 },
      { header: 'Tax Amount', key: 'taxAmount', width: 20 },
      { header: 'Total', key: 'total', width: 20 },
      { header: 'Notes', key: 'notes', width: 40 },
      { header: 'Created Date', key: 'createdAt', width: 20 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    invoices.forEach(invoice => {
      worksheet.addRow({
        id: invoice.id || '',
        number: invoice.number || '',
        date: invoice.date ? new Date(invoice.date).toLocaleDateString() : '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '',
        customerName: invoice.customerName || 'N/A',
        customerEmail: invoice.customerEmail || 'N/A',
        customerPhone: invoice.customerPhone || 'N/A',
        status: invoice.status?.toUpperCase() || 'DRAFT',
        itemsCount: invoice.itemsCount || 0,
        subtotal: invoice.subtotal || 0,
        taxRate: invoice.taxRate || 0,
        taxAmount: invoice.taxAmount || 0,
        total: invoice.total || 0,
        notes: invoice.notes || '',
        createdAt: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : ''
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 15);
    });

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
    
  } catch (error) {
    console.error('❌ Excel generator error:', error);
    throw error;
  }
}

module.exports = { generateCustomersExcel, generateInvoicesExcel };
