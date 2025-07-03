import { Order, OrderStatus } from "@/common/types/order";
import { formatCurrency, formatDate } from "@/utils/format";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "jspdf-autotable"; // Import for TypeScript support

/**
 * Generate PDF invoice for an order
 * @param order Order to generate invoice for
 */
export const generateInvoice = async (order: Order): Promise<Blob> => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Set document properties
  doc.setProperties({
    title: `Invoice #INV-${order.referenceNumber || order.id}`,
    subject: "Order Invoice",
    author: "Deploy Hub",
    keywords: "invoice, order, license",
    creator: "Deploy Hub Invoice System",
  });

  // Define constants for positioning
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Add company logo and info
  doc.setFontSize(22);
  doc.setTextColor(44, 62, 80); // Dark blue color
  doc.text("DEPLOY HUB", margin, margin);

  // Add invoice title
  doc.setFontSize(16);
  doc.text("INVOICE", pageWidth - margin - 40, margin);

  // Company information
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    [
      "Deploy Hub Inc.",
      "123 Tech Avenue",
      "San Francisco, CA 94105",
      "United States",
      "support@deployhub.com",
    ],
    margin,
    margin + 10
  );

  // Add invoice information
  const invoiceNumber = `INV-${order.referenceNumber || order.id}`;
  const invoiceDate = formatDate(
    order.completedAt || order.updatedAt || order.createdAt
  );

  doc.setFontSize(10);
  doc.text(
    [
      `Invoice Number: ${invoiceNumber}`,
      `Date: ${invoiceDate}`,
      `Order Reference: ${order.referenceNumber || order.id}`,
    ],
    pageWidth - margin - 80,
    margin + 10
  );

  // Customer information
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text("BILLED TO:", margin, margin + 40);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text([`${"Customer"}`, `${"customer@example.com"}`], margin, margin + 46);

  // Payment Status
  const paymentStatus =
    order.status === OrderStatus.COMPLETED ? "PAID" : order.status;
  doc.setFontSize(12);
  // Fix the setTextColor call - pass RGB values in a single call or as an array
  if (order.status === OrderStatus.COMPLETED) {
    doc.setTextColor(39, 174, 96); // Green for completed/paid
  } else {
    doc.setTextColor(231, 76, 60); // Red for other statuses
  }
  doc.text(`Status: ${paymentStatus}`, pageWidth - margin - 80, margin + 40);

  // Add invoice items using autotable
  autoTable(doc, {
    startY: margin + 60,
    head: [["Description", "Quantity", "Unit Price", "Total"]],
    body: [
      [
        order.license?.name || "License",
        "1",
        formatCurrency(order.currency, order.amount),
        formatCurrency(order.currency, order.amount),
      ],
    ],
    foot: [
      ["", "", "Subtotal", formatCurrency(order.currency, order.amount)],
      ["", "", "Tax (0%)", formatCurrency(order.currency, 0)],
      ["", "", "Total", formatCurrency(order.currency, order.amount)],
    ],
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: [44, 62, 80],
      fontStyle: "bold",
    },
    theme: "grid",
    margin: { left: margin, right: margin },
  });

  // Add license details if available
  if (order.license) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentY = (doc as any).lastAutoTable.finalY + 20; // Position after the table

    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text("LICENSE DETAILS", margin, currentY);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      [
        `Name: ${order.license.name}`,
        `Description: ${order.license.description}`,
        `Deployment Limit: ${order.license.deploymentLimit} deployments`,
        `Duration: ${
          order.license.duration === 0
            ? "Unlimited"
            : `${order.license.duration} days`
        }`,
      ],
      margin,
      currentY + 6
    );
  }

  // Add footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Thank you for your business with Deploy Hub.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Generate PDF blob
  return doc.output("blob");
};

/**
 * Download an invoice for an order
 * @param order Order to download invoice for
 */
export const downloadInvoice = async (order: Order): Promise<void> => {
  try {
    // Generate the invoice PDF
    const pdfBlob = await generateInvoice(order);

    // Create a URL for the Blob
    const url = URL.createObjectURL(pdfBlob);

    // Create a link element to trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${order.referenceNumber || order.id}.pdf`;

    // Append to the document, click it, and then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading invoice:", error);
    throw new Error("Failed to download invoice");
  }
};
