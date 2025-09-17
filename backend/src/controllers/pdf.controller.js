// src/controllers/pdf.controller.js

const {
  Invoice,
  Customer,
  InvoiceItem,
  BusinessProfile,
  Payment,
  ContactDetail,
  PaymentDetail,
  sequelize,
} = require("../models");
const pdfService = require("../services/pdf.generator");

exports.getInvoicePDF = async (req, res, next) => {
  try {

    
    // fetch the invoice, its customer & line‐items
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Customer, as: "Customer" },
        { model: InvoiceItem, as: "items" },
        { model: ContactDetail, as: "contactDetail" },
        { model: PaymentDetail, as: "paymentDetail" },
      ],
    });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }



    // fetch global settings (company info, logo, footer text)
    const businessProfile = await BusinessProfile.findOne();
    const settings = businessProfile
      ? {
          company_name: businessProfile.company_name || "Enterprise ERP",
          company_address:
            businessProfile.company_address ||
            "123 Business Street, City, State 12345",
          company_city: businessProfile.company_city || "",
          company_country: businessProfile.company_country || "",
          company_phone: businessProfile.company_phone || "+1-555-0123",
          company_email:
            businessProfile.company_email || "info@enterprise-erp.com",
          company_website:
            businessProfile.company_website || "www.enterprise-erp.com",
          company_reg_number:
            businessProfile.company_reg_number || "TAX-123456789",
          company_logo: "",
          public_server_file: "",
          currency: businessProfile.currency || "USD",
          invoice_footer:
            businessProfile.invoice_footer || "Thank you for your business!",
        }
      : {
          company_name: "Enterprise ERP",
          company_address: "123 Business Street, City, State 12345",
          company_city: "",
          company_country: "",
          company_phone: "+1-555-0123",
          company_email: "info@enterprise-erp.com",
          company_website: "www.enterprise-erp.com",
          company_reg_number: "TAX-123456789",
          company_logo: "",
          public_server_file: "",
          currency: "USD",
          invoice_footer: "Thank you for your business!",
        };

    console.log("Using settings:", JSON.stringify(settings, null, 2));

    // Add logo data to settings if it exists
    if (businessProfile?.company_logo) {
      settings.company_logo = `data:${businessProfile.logo_type};base64,${businessProfile.company_logo.toString("base64")}`;
    }

    // Fetch the single active contact & payment details for getInvoicePDF function
    let contactDetail, paymentDetail;
    
    try {
      contactDetail = await ContactDetail.findOne({
        where: { isActive: true },
      });
      console.log("Contact query successful for getInvoicePDF");
    } catch (contactErr) {
      console.error("Error fetching contact details:", contactErr);
    }
    
    try {
      paymentDetail = await PaymentDetail.findOne({
        where: { isActive: true },
      });
      console.log("Payment query successful for getInvoicePDF");
    } catch (paymentErr) {
      console.error("Error fetching payment details:", paymentErr);
    }

    // If no active ones found, try to get any available
    if (!contactDetail) {
      const anyContact = await ContactDetail.findOne();
      console.log("No active contact found, trying any contact:", JSON.stringify(anyContact, null, 2));
      if (anyContact) {
        contactDetail = anyContact;
      }
    }
    if (!paymentDetail) {
      const anyPayment = await PaymentDetail.findOne();
      console.log("No active payment found, trying any payment:", JSON.stringify(anyPayment, null, 2));
      if (anyPayment) {
        paymentDetail = anyPayment;
      }
    }

    // Debug: Check if tables exist and have data
    try {
      const allContacts = await ContactDetail.findAll();
      console.log(`Total contacts in database: ${allContacts.length}`);
      const allPayments = await PaymentDetail.findAll();
      console.log(`Total payment details in database: ${allPayments.length}`);
      
      // Check table structure
      const contactTableInfo = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ContactDetails'");
      console.log("ContactDetails table structure:", contactTableInfo[0]);
      const paymentTableInfo = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'PaymentDetails'");
      console.log("PaymentDetails table structure:", paymentTableInfo[0]);
      
      // Check if we can insert a test record (this will help identify permission issues)
      try {
        const testContact = await ContactDetail.create({
          name: "Test Contact",
          email: "test@example.com",
          telephone: "123-456-7890",
          department: "Test Department",
          isActive: true
        });
        console.log("Test contact created successfully:", testContact.id);
        // Clean up the test record
        await testContact.destroy();
        console.log("Test contact cleaned up");
      } catch (insertErr) {
        console.error("Test insert failed:", insertErr);
      }
      
      // Test payment details insert
      try {
        const testPayment = await PaymentDetail.create({
          name: "Test Payment",
          bank: "Test Bank",
          accountNumber: "1234567890",
          branch: "Test Branch",
          bankCode: "TB001",
          branchCode: "TB001",
          swiftCode: "TESTSWIFT",
          isDefault: false,
          isActive: true
        });
        console.log("Test payment created successfully:", testPayment.id);
        // Clean up the test record
        await testPayment.destroy();
        console.log("Test payment cleaned up");
      } catch (insertErr) {
        console.error("Test payment insert failed:", insertErr);
      }
    } catch (debugErr) {
      console.error("Debug query error:", debugErr);
    }

    console.log("Contact Detail:", JSON.stringify(contactDetail, null, 2));
    console.log("Payment Detail:", JSON.stringify(paymentDetail, null, 2));

    // generate PDF
    const pdfBuffer = await pdfService.generateInvoicePDF({
      model: invoice,
      contactDetail,
      paymentDetail,
      settings,
      dateFormat: "YYYY-MM-DD",
    });

    // stream back as download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice.invoiceNumber || invoice.number}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating invoice PDF:", err);
    res
      .status(500)
      .json({ message: "Failed to generate PDF", error: err.message });
  }
};

exports.getPaymentPDF = async (req, res, next) => {
  try {
    // fetch the payment with its invoice and customer
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Invoice,
          as: "Invoice",
          attributes: ["id", "total", "number"],
          include: [
            {
              model: Customer,
              as: "Customer",
              attributes: ["id", "name", "email", "phone"],
            },
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    console.log("Payment data for PDF:", JSON.stringify(payment, null, 2));

    // fetch global settings (company info, logo, footer text)
    const businessProfile = await BusinessProfile.findOne();
    const settings = businessProfile
      ? {
          company_name: businessProfile.company_name || "Enterprise ERP",
          company_address:
            businessProfile.company_address ||
            "123 Business Street, City, State 12345",
          company_city: businessProfile.company_city || "",
          company_country: businessProfile.company_country || "",
          company_phone: businessProfile.company_phone || "+1-555-0123",
          company_email:
            businessProfile.company_email || "info@enterprise-erp.com",
          company_website:
            businessProfile.company_website || "www.enterprise-erp.com",
          company_reg_number:
            businessProfile.company_reg_number || "TAX-123456789",
          company_logo: "",
          public_server_file: "",
          currency: businessProfile.currency || "KES",
          invoice_footer:
            businessProfile.invoice_footer || "Thank you for your business!",
        }
      : {
          company_name: "Enterprise ERP",
          company_address: "123 Business Street, City, State 12345",
          company_city: "",
          company_country: "",
          company_phone: "+1-555-0123",
          company_email: "info@enterprise-erp.com",
          company_website: "www.enterprise-erp.com",
          company_reg_number: "TAX-123456789",
          company_logo: "",
          public_server_file: "",
          currency: "KES",
          invoice_footer: "Thank you for your business!",
        };

    console.log("Using settings:", JSON.stringify(settings, null, 2));

    // Add logo data to settings if it exists
    if (businessProfile?.company_logo) {
      settings.company_logo = `data:${businessProfile.logo_type};base64,${businessProfile.company_logo.toString("base64")}`;
    }

    // generate PDF
    const pdfBuffer = await pdfService.generatePaymentPDF({
      model: payment,
      settings,
      dateFormat: "YYYY-MM-DD",
    });

    // stream back as download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=payment-${payment.id}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating payment PDF:", err);
    res
      .status(500)
      .json({ message: "Failed to generate PDF", error: err.message });
  }
};

exports.generateInvoiceFromData = async (req, res, next) => {
  try {
    // Debug: Check if models are imported correctly
    console.log("ContactDetail model (from data):", typeof ContactDetail);
    console.log("PaymentDetail model (from data):", typeof PaymentDetail);
    
    // Debug: Test database connection
    try {
      await sequelize.authenticate();
      console.log("Database connection successful (from data)");
      
      // Check if tables exist
      const tables = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      console.log("Available tables (from data):", tables[0].map(t => t.table_name));
    } catch (dbErr) {
      console.error("Database connection failed (from data):", dbErr);
    }
    
    const invoiceData = req.body;

    console.log("Received invoice data:", JSON.stringify(invoiceData, null, 2));

    if (
      !invoiceData ||
      !invoiceData.items ||
      !Array.isArray(invoiceData.items)
    ) {
      return res.status(400).json({ message: "Invalid invoice data" });
    }

    // Validate items structure
    for (let i = 0; i < invoiceData.items.length; i++) {
      const item = invoiceData.items[i];
      console.log(`Validating item ${i + 1}:`, item);

      if (!item.item && !item.name && !item.itemName) {
        return res.status(400).json({
          message: `Item ${i + 1} is missing name (item, name, or itemName)`,
          item: item,
        });
      }
      if (!item.quantity) {
        return res.status(400).json({
          message: `Item ${i + 1} is missing quantity`,
          item: item,
        });
      }
      if (!item.pricePer && !item.price) {
        return res.status(400).json({
          message: `Item ${i + 1} is missing price (pricePer or price)`,
          item: item,
        });
      }
    }

    // Log the items data specifically
    console.log(
      "Items data for PDF generation:",
      JSON.stringify(invoiceData.items, null, 2)
    );

    // fetch global settings (company info, logo, footer text)
    const businessProfile = await BusinessProfile.findOne();
    const settings = businessProfile
      ? {
          company_name: businessProfile.company_name || "Enterprise ERP",
          company_address:
            businessProfile.company_address ||
            "123 Business Street, City, State 12345",
          company_city: businessProfile.company_city || "",
          company_country: businessProfile.company_country || "",
          company_phone: businessProfile.company_phone || "+1-555-0123",
          company_email:
            businessProfile.company_email || "info@enterprise-erp.com",
          company_website:
            businessProfile.company_website || "www.enterprise-erp.com",
          company_reg_number:
            businessProfile.company_reg_number || "TAX-123456789",
          company_logo: "",
          public_server_file: "",
          currency: businessProfile.currency || "USD",
          invoice_footer:
            businessProfile.invoice_footer || "Thank you for your business!",
        }
      : {
          company_name: "Enterprise ERP",
          company_address: "123 Business Street, City, State 12345",
          company_city: "",
          company_country: "",
          company_phone: "+1-555-0123",
          company_email: "info@enterprise-erp.com",
          company_website: "www.enterprise-erp.com",
          company_reg_number: "TAX-123456789",
          company_logo: "",
          public_server_file: "",
          currency: "USD",
          invoice_footer: "Thank you for your business!",
        };

    console.log("Using settings:", JSON.stringify(settings, null, 2));

    // Add logo data to settings if it exists
    if (businessProfile?.company_logo) {
      settings.company_logo = `data:${businessProfile.logo_type};base64,${businessProfile.company_logo.toString("base64")}`;
    }

    // Fetch the single active contact & payment details for generateInvoiceFromData function
    let contactDetail, paymentDetail;
    
    try {
      contactDetail = await ContactDetail.findOne({
        where: { isActive: true },
      });
      console.log("Contact query successful for generateInvoiceFromData");
    } catch (contactErr) {
      console.error("Error fetching contact details:", contactErr);
    }
    
    try {
      paymentDetail = await PaymentDetail.findOne({
        where: { isActive: true },
      });
      console.log("Payment query successful for generateInvoiceFromData");
    } catch (paymentErr) {
      console.error("Error fetching payment details:", paymentErr);
    }

    // If no active ones found, try to get any available
    if (!contactDetail) {
      const anyContact = await ContactDetail.findOne();
      console.log("No active contact found (from data), trying any contact:", JSON.stringify(anyContact, null, 2));
      if (anyContact) {
        contactDetail = anyContact;
      }
    }
    if (!paymentDetail) {
      const anyPayment = await PaymentDetail.findOne();
      console.log("No active payment found (from data), trying any payment:", JSON.stringify(anyPayment, null, 2));
      if (anyPayment) {
        paymentDetail = anyPayment;
      }
    }

    // Debug: Check if tables exist and have data
    try {
      const allContacts = await ContactDetail.findAll();
      console.log(`Total contacts in database (from data): ${allContacts.length}`);
      const allPayments = await PaymentDetail.findAll();
      console.log(`Total payment details in database (from data): ${allPayments.length}`);
      
      // Check table structure
      const contactTableInfo = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ContactDetails'");
      console.log("ContactDetails table structure (from data):", contactTableInfo[0]);
      const paymentTableInfo = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'PaymentDetails'");
      console.log("PaymentDetails table structure (from data):", paymentTableInfo[0]);
      
      // Test insert operations for both tables
      try {
        const testContact = await ContactDetail.create({
          name: "Test Contact From Data",
          email: "testfromdata@example.com",
          telephone: "123-456-7890",
          department: "Test Department",
          isActive: true
        });
        console.log("Test contact created successfully (from data):", testContact.id);
        await testContact.destroy();
        console.log("Test contact cleaned up (from data)");
      } catch (insertErr) {
        console.error("Test insert failed (from data):", insertErr);
      }
      
      try {
        const testPayment = await PaymentDetail.create({
          name: "Test Payment From Data",
          bank: "Test Bank",
          accountNumber: "1234567890",
          branch: "Test Branch",
          bankCode: "TB001",
          branchCode: "TB001",
          swiftCode: "TESTSWIFT",
          isDefault: false,
          isActive: true
        });
        console.log("Test payment created successfully (from data):", testPayment.id);
        await testPayment.destroy();
        console.log("Test payment cleaned up (from data)");
      } catch (insertErr) {
        console.error("Test payment insert failed (from data):", insertErr);
      }
    } catch (debugErr) {
      console.error("Debug query error (from data):", debugErr);
    }

    console.log("Contact Detail (from data):", JSON.stringify(contactDetail, null, 2));
    console.log("Payment Detail (from data):", JSON.stringify(paymentDetail, null, 2));

    // generate PDF from form data
    const pdfBuffer = await pdfService.generateInvoicePDF({
      model: invoiceData,
      contactDetail,
      paymentDetail,
      settings,
      dateFormat: "YYYY-MM-DD",
    });

    // stream back as download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoiceData.number || "INV-001"}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating invoice PDF from data:", err);
    res
      .status(500)
      .json({ message: "Failed to generate PDF", error: err.message });
  }
};
