// src/services/pdf.generator.js
const path = require("path");
const pug = require("pug");
const puppeteer = require("puppeteer");
const moment = require("moment");

async function generateInvoicePDF({ model, settings, dateFormat, contactDetail, paymentDetail }) {

  
  // 1) Compile Pug to HTML
  const templatePath = path.join(__dirname, "..", "views", "invoice.pug");
  const html = pug.renderFile(templatePath, {
    model,
    contactDetail,
    paymentDetail,
    settings,
    dateFormat,
    moment,
  });

  // 2) Launch headless Chrome
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // 3) Ensure print media rules (@page) are used
  await page.emulateMediaType("print");

  // 4) Load HTML and wait for assets
  await page.setContent(html, { waitUntil: "networkidle0" });

  // 5) Extra safety: wait for fonts and images to settle
  try {
    await page.evaluateHandle(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  } catch {}
  await page.waitForFunction(() =>
    Array.from(document.images || []).every((img) => img.complete)
  );

  // 6) Generate PDF buffer
  const pdfBuffer = await page.pdf({
    // Let CSS @page control size and margins (see invoice.pug @page)
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    // format can be omitted when using preferCSSPageSize + @page size,
    // but keeping it is fine as a fallback:
    format: "A4",
  });

  await browser.close();
  return pdfBuffer;
}

async function generatePaymentPDF({ model, settings, dateFormat }) {
  // 1) Compile Pug to HTML
  const templatePath = path.join(__dirname, "..", "views", "payment.pug");
  const html = pug.renderFile(templatePath, {
    model,
    settings,
    dateFormat,
    moment,
  });

  // 2) Launch headless Chrome
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // 3) Ensure print media rules (@page) are used
  await page.emulateMediaType("print");

  // 4) Load HTML and wait for assets
  await page.setContent(html, { waitUntil: "networkidle0" });

  // 5) Extra safety: wait for fonts and images to settle
  try {
    await page.evaluateHandle(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  } catch {}
  await page.waitForFunction(() =>
    Array.from(document.images || []).every((img) => img.complete)
  );

  // 6) Generate PDF buffer
  const pdfBuffer = await page.pdf({
    // Let CSS @page control size and margins (see payment.pug @page)
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    // format can be omitted when using preferCSSPageSize + @page size,
    // but keeping it is fine as a fallback:
    format: "A4",
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = { generateInvoicePDF, generatePaymentPDF };