import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  Card,
  Input,
  Popconfirm,
  Tag,
  Tooltip,
  Modal,
  Descriptions,
  Select,
  Typography,
  DatePicker,
  List,
  Divider,
  Dropdown,
  Menu,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  PrinterOutlined,
  SearchOutlined,
  MessageOutlined,
  LockOutlined,
  UnlockOutlined,
  DollarOutlined,
  SwapOutlined,
  ScheduleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import NotesDrawer from "./NotesDrawer.jsx";
import PaymentHistoryDrawer from "././PaymentHistoryDrawer.jsx";
import FollowUpDrawer from "././FollowUpDrawer.jsx";
import axios from "../../api/axios.js";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const InvoiceList = ({
  invoices,
  onAddNew,
  onEdit,
  onDelete, // onDelete prop is available here
  onSearch,
  refreshInvoices,
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [notesDrawerVisible, setNotesDrawerVisible] = useState(false);
  const [followUpDrawerVisible, setFollowUpDrawerVisible] = useState(false);
  const [paymentDrawerVisible, setPaymentDrawerVisible] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("Invoice");
  const [itemViewModalVisible, setItemViewModalVisible] = useState(false);
  const [invoiceStatusMap, setInvoiceStatusMap] = useState({}); // New state to hold calculated payment statuses

  // NEW STATE: For filtering Proforma conversion status
  const [conversionStatusFilter, setConversionStatusFilter] = useState("all");

  // Get unique business names for filter dropdown
  const uniqueBusinessNames = [
    ...new Set(invoices.map((inv) => inv.businessName)),
  ];

  // Function to calculate payment status based on total paid vs total amount
  const calculatePaymentStatus = (invoice) => {
    const totalAmount = parseFloat(invoice.totalAmount) || 0;
    const totalPaid = invoice.paymentHistory?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;

    if (totalAmount <= 0) {
      return "N/A"; // Or some other appropriate status for zero-amount invoices
    }

    // Allow for minor floating point discrepancies when checking for full payment
    if (totalPaid >= totalAmount - 0.01) { 
      return "paid";
    } else if (totalPaid > 0 && totalPaid < totalAmount) {
      return "partial";
    } else {
      return "pending";
    }
  };

  // Effect to update invoiceStatusMap whenever invoices prop changes
  useEffect(() => {
    const newStatusMap = {};
    invoices.forEach(invoice => {
      newStatusMap[invoice._id] = calculatePaymentStatus(invoice);
    });
    setInvoiceStatusMap(newStatusMap);
  }, [invoices]);

  // Convert number to words for amount in words section
  const numberToWords = (num) => {
    const units = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "Ten",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? " " + units[num % 10] : "")
      );
    if (num < 1000)
      return (
        units[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " and " + numberToWords(num % 100) : "")
      );
    if (num < 100000)
      return (
        numberToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + numberToWords(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        numberToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + numberToWords(num % 100000) : "")
      );
    return (
      numberToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + numberToWords(num % 10000000) : "")
    );
  };

  // Format currency in Indian style
  const formatIndianCurrency = (num) => {
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Generate PDF document for an invoice
  const generatePDF = (invoice) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set document properties
      doc.setProperties({
        title: `${invoice.invoiceType} - ${
          invoice.invoiceNumber || invoice.proformaNumber
        }`, // Use appropriate number
        subject: "Invoice",
        author: "Your Company Name",
        keywords: "invoice, billing",
        creator: "Invoice Management System",
      });

      // Set margins and initial position
      const margin = 15;
      let yPos = margin;

      // Invoice title (centered)
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(
        invoice.invoiceType === "Proforma" ? "PROFORMA INVOICE" : "TAX INVOICE",
        105,
        yPos,
        { align: "center" }
      );
      yPos += 10;

      // Company address (left aligned)
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Your Company Name", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text("Your Company Address Line 1", margin, yPos + 5);
      doc.text("Your Company Address Line 2", margin, yPos + 10);
      doc.text("City, State - PIN, Country", margin, yPos + 15);
      doc.text(
        `GSTIN: ${invoice.companyGSTIN || "XXXXXXXXXXXXXXX"}`,
        margin,
        yPos + 20
      );
      yPos += 30;

      // Customer details and invoice info (two columns)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Bill To: ${invoice.customerName || "N/A"}`, margin, yPos);
      // Conditionally display Invoice No or Proforma No
      doc.text(
        `${
          invoice.invoiceType === "Proforma" ? "Proforma No" : "Invoice No"
        }: ${
          invoice.invoiceType === "Proforma"
            ? invoice.proformaNumber
            : invoice.invoiceNumber || "N/A"
        }`,
        140,
        yPos
      );
      yPos += 5;

      doc.text(`Contact: ${invoice.contactPerson || "N/A"}`, margin, yPos);
      doc.text(
        `Date: ${invoice.date || new Date().toLocaleDateString()}`,
        140,
        yPos
      );
      yPos += 5;

      doc.text(`Phone: ${invoice.contactNumber || "N/A"}`, margin, yPos);
      doc.text(`Due Date: ${invoice.dueDate || "N/A"}`, 140, yPos);
      yPos += 5;

      doc.text(`GSTIN: ${invoice.customerGSTIN || "N/A"}`, margin, yPos);
      yPos += 5;

      doc.text(`Address: ${invoice.customerAddress || "N/A"}`, margin, yPos);
      yPos += 10;

      // Items table - ensure all values are properly formatted
      const tableData = (invoice.items || []).map((item, index) => {
        const description = item?.description?.toString() || "N/A";
        // Concatenate specifications for display in PDF
        const specifications =
          item?.specifications && item.specifications.length > 0
            ? item.specifications
                .map((spec) => `${spec.name}: ${spec.value}`)
                .join(", ")
            : "N/A";
        const quantity = item?.quantity?.toString() || "1";
        const rate = item?.rate?.toString() || "0";
        const total = (parseFloat(quantity) * parseFloat(rate)).toFixed(2);

        return [
          (index + 1).toString(),
          description,
          specifications, // Include concatenated specifications in table data
          quantity,
          `₹${formatIndianCurrency(parseFloat(rate))}`,
          `₹${formatIndianCurrency(parseFloat(total))}`,
        ];
      });

      // Add items table using autoTable
      autoTable(doc, {
        head: [
          [
            "S.No",
            "Description",
            "Specification",
            "Qty",
            "Unit Price (₹)",
            "Total (₹)",
          ],
        ], // Add 'Specification' header
        body: tableData,
        startY: yPos,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 50 }, // Adjusted width for Description
          2: { cellWidth: 35 }, // New column for Specification
          3: { cellWidth: 15 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
        },
      });

      // Get final Y position after table
      yPos = doc.lastAutoTable.finalY + 10;

      // Amount summary section
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Amount Summary:", margin, yPos);
      yPos += 5;

      const subTotal = parseFloat(invoice.subTotal) || 0; // Use subTotal from invoice data
      const igstAmount = parseFloat(invoice.igstAmount) || 0;
      const cgstAmount = parseFloat(invoice.cgstAmount) || 0;
      const sgstAmount = parseFloat(invoice.sgstAmount) || 0;
      const totalGSTAmount = igstAmount + cgstAmount + sgstAmount; // This variable is not used in PDF output but is calculated.
      const grandTotal = parseFloat(invoice.totalAmount) || 0; // Grand total is already calculated in InvoiceForm

      doc.text(`Sub Total:`, 140, yPos);
      doc.text(`₹${formatIndianCurrency(subTotal)}`, 200 - margin, yPos, {
        align: "right",
      });
      yPos += 5;

      if (invoice.gstType === "interstate") {
        doc.text(`IGST (${invoice.gstPercentage || 0}%):`, 140, yPos);
        doc.text(`₹${formatIndianCurrency(igstAmount)}`, 200 - margin, yPos, {
          align: "right",
        });
        yPos += 5;
      } else if (invoice.gstType === "intrastate") {
        const gstHalf = (invoice.gstPercentage || 0) / 2;
        doc.text(`CGST (${gstHalf}%):`, 140, yPos);
        doc.text(`₹${formatIndianCurrency(cgstAmount)}`, 200 - margin, yPos, {
          align: "right",
        });
        yPos += 5;
        doc.text(`SGST (${gstHalf}%):`, 140, yPos);
        doc.text(`₹${formatIndianCurrency(sgstAmount)}`, 200 - margin, yPos, {
          align: "right",
        });
        yPos += 5;
      }

      doc.text(`Grand Total:`, 140, yPos);
      doc.text(`₹${formatIndianCurrency(grandTotal)}`, 200 - margin, yPos, {
        align: "right",
      });
      yPos += 10;

      // Amount in words section
      doc.setFont("helvetica", "bold");
      doc.text("Amount in Words:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${numberToWords(Math.floor(grandTotal))} Rupees Only`,
        margin + 30,
        yPos
      );
      yPos += 15;

      // Payment terms section
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Terms:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(
        invoice.paymentTerms || "Payment due within 15 days of invoice date",
        margin + 25,
        yPos
      );
      yPos += 10;

      // Notes section
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(
        invoice.notes || "Thank you for your business!",
        margin + 15,
        yPos,
        { maxWidth: 180 }
      );
      yPos += 15;

      // Bank details section
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Bank Details:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text("Bank Name: Your Bank Name", margin, yPos + 5);
      doc.text("Account Number: XXXXXXXXXXXX", margin, yPos + 10);
      doc.text("IFSC Code: XXXXXXXXXX", margin, yPos + 15);
      doc.text("Branch: Your Branch Name", margin, yPos + 20);
      yPos += 30;

      // Footer
      doc.setFontSize(10);
      doc.text(
        "This is Computer Generated Invoice & requires no Signature",
        105,
        yPos,
        { align: "center" }
      );

      // Save the PDF with appropriate filename
      const pdfBlob = doc.output("blob");
      saveAs(
        pdfBlob,
        `${invoice.invoiceType.toLowerCase()}-${
          invoice.invoiceType === "Proforma"
            ? invoice.proformaNumber
            : invoice.invoiceNumber || "draft"
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Search handler
  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value); // This calls the onSearch prop from the parent
  };

  // View invoice details handler
  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setViewModalVisible(true);
  };

  // View notes handler
  const handleViewNotes = (invoice) => {
    setSelectedInvoice(invoice);
    setNotesDrawerVisible(true);
  };

  // View payment history handler
  const handleViewPayments = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDrawerVisible(true);
  };

  // New handler for viewing item specifications
  const handleViewItemSpecs = (invoice) => {
    setSelectedInvoice(invoice);
    setItemViewModalVisible(true);
  };

  // New handler for showing follow-up drawer
  const handleShowFollowUpDrawer = (invoice) => {
    setSelectedInvoice(invoice);
    setFollowUpDrawerVisible(true);
  };

  // Close invoice handler - marks an invoice as closed/locked
  const handleCloseInvoice = async (id) => {
    const toastId = toast.loading("Closing invoice...");
    try {
      await axios.patch(`/api/invoices/${id}/close`);
      toast.success("Invoice closed successfully", { id: toastId });
      refreshInvoices?.(); // Refresh the invoice list to reflect the change
    } catch (error) {
      console.error("Error closing invoice:", error);
      toast.error("Failed to close invoice", { id: toastId });
    }
  };

  // Unlock invoice handler - marks an invoice as unlocked/editable
  const handleUnlockInvoice = async (id) => {
    const toastId = toast.loading("Unlocking invoice...");
    try {
      await axios.patch(`/api/invoices/${id}/unlock`);
      toast.success("Invoice unlocked successfully", { id: toastId });
      refreshInvoices?.(); // Refresh the invoice list to reflect the change
    } catch (error) {
      console.error("Error unlocking invoice:", error);
      toast.error("Failed to unlock invoice", { id: toastId });
    }
  };

  // Export to Excel handler
  const exportToExcel = () => {
    const data = filteredInvoices.map((inv, index) => ({
      SNo: index + 1,
      // Conditional export for InvoiceNumber or ProformaNumber
      Number: inv.invoiceType === "Proforma" ? inv.proformaNumber : inv.invoiceNumber, 
      Type: inv.invoiceType,
      Business: inv.businessName,
      Customer: inv.customerName,
      TotalAmount: inv.totalAmount || 0,
      Date: inv.date,
      DueDate: inv.dueDate || "",
      Status: invoiceStatusMap[inv._id] || inv.paymentStatus, // Use calculated status for export
      Closed: inv.isClosed ? "Yes" : "No",
      ConversionStatus:
        inv.invoiceType === "Proforma" ? inv.conversionStatus || "N/A" : "N/A", // NEW: Export conversion status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    // Correct MIME type for Excel files
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, `Invoices-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Filter invoices based on various criteria
  const filteredInvoices = invoices.filter((inv) => {
    const matchesType = inv.invoiceType === invoiceTypeFilter;
    const matchesSearch =
      !searchTerm ||
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.proformaNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || // Search by proformaNumber as well
      inv.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate =
      !dateRange ||
      (new Date(inv.date) >= dateRange[0].toDate() &&
        new Date(inv.date) <= dateRange[1].toDate());
    const calculatedStatus = invoiceStatusMap[inv._id]; // Get calculated status
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "overdue"
        ? calculatedStatus !== "paid" && new Date(inv.dueDate) < new Date()
        : calculatedStatus === statusFilter; // Use calculated status for filtering
    const matchesBusiness =
      businessFilter === "all" ? true : inv.businessName === businessFilter;

    // NEW: Filter by conversion status (only applies to Proforma invoices)
    const matchesConversionStatus =
      conversionStatusFilter === "all"
        ? true
        : inv.invoiceType === "Proforma" &&
          inv.conversionStatus === conversionStatusFilter;

    return (
      matchesType &&
      matchesSearch &&
      matchesDate &&
      matchesStatus &&
      matchesBusiness &&
      matchesConversionStatus
    );
  });

  // Get status tag component for displaying payment status
  const getStatusTag = (status) => {
    let tagColor = "red";
    let tagText = "Payment Pending";

    if (status === "paid") {
      tagColor = "green";
      tagText = "Completed Payment";
    } else if (status === "partial") {
      tagColor = "orange";
      tagText = "Partial Payment";
    }

    return <Tag color={tagColor}>{tagText}</Tag>;
  };

  // Invoice type tabs component for switching between Invoice and Proforma views
  const invoiceTypeTabs = (
    <Space style={{ marginBottom: 16 }}>
      {["Invoice", "Proforma"].map((type) => {
        // Count invoices for each type to display in the tab
        const count = invoices.filter((inv) => inv.invoiceType === type).length;
        const isActive = invoiceTypeFilter === type;
        return (
          <span
            key={type}
            onClick={() => setInvoiceTypeFilter(type)}
            style={{
              cursor: "pointer",
              borderBottom: isActive ? "2px solid #1890ff" : "none",
              color: isActive ? "#1890ff" : "#000",
              fontWeight: isActive ? "600" : "normal",
              paddingBottom: 4,
              marginRight: 20,
            }}
          >
            {type} ({count})
          </span>
        );
      })}
    </Space>
  );

  // Columns for the Items Table within the modal
  const getItemsTableColumns = () => [
    {
      title: "S.No",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (text, record) => {
        // This logic checks if description is empty, and if so,
        // it tries to use a 'SPECIFICATION' from the specifications array.
        // Otherwise, it defaults to 'N/A'.
        if (!text && record.specifications?.length > 0) {
          const mainSpec = record.specifications.find(
            (s) => s.name === "SPECIFICATION"
          );
          return mainSpec ? mainSpec.value : "N/A";
        }
        return text || "N/A";
      },
    },
    {
      title: "HSN/SAC",
      dataIndex: "hsnSac",
      width: 100,
      align: "center",
      render: (text) => text || "N/A",
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      width: 80,
      align: "center",
      render: (qty) => parseFloat(qty) || 0,
    },
    {
      title: "Unit Price (₹)",
      width: 140,
      align: "right",
      render: (_, item) => formatIndianCurrency(item.rate || 0),
    },
    {
      title: "Total (₹)",
      width: 140,
      align: "right",
      render: (_, item) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatIndianCurrency((item.quantity || 0) * (item.rate || 0))}
        </Text>
      ),
    },
  ];

  // Table columns configuration for the main InvoiceList
  const columns = [
    {
      title: "S.No",
      render: (_, __, index) => <Text strong>{index + 1}</Text>,
      width: 60,
    },
    {
      title: "Number", // Changed to 'Number' to be generic for Invoice/Proforma
      render: (_, record) => (
        <Tag icon={<FileTextOutlined />} color="blue">
          {record.invoiceType === "Proforma"
            ? record.proformaNumber
            : record.invoiceNumber}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "invoiceType",
      render: (type) => (
        <Tag color={type === "Proforma" ? "purple" : "cyan"}>{type}</Tag>
      ),
    },
    {
      title: "Business",
      render: (_, record) => {
        const name = record.businessId?.businessName || record.businessName;
        return (
          <Tooltip title={name}>
            <Text strong>{name}</Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Customer",
      render: (_, record) => {
        const customer = record.businessId || {};
        const name = customer.businessName || record.customerName || "N/A";
        return (
          <Tooltip title={name}>
            <Text>{name}</Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      align: "right",
      render: (amt) => (
        <Text style={{ color: "#52c41a" }}>₹{(amt || 0).toFixed(2)}</Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      align: "center",
      render: (date) => <Text>{date || "N/A"}</Text>,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      align: "center",
      render: (date) => <Text>{date || "N/A"}</Text>,
    },
    // Updated Payment Status Column to be more precise
    {
      title: "Payment Status",
      key: "paymentStatusLabel", // Unique key for the column
      align: "center",
      render: (_, record) => {
        const calculatedStatus = invoiceStatusMap[record._id] || "pending"; // Get status from map
        return getStatusTag(calculatedStatus);
      },
    },
    {
      title: "Actions",
      width: 80, // Adjusted width for dropdown
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
              >
                View Invoice Details
              </Menu.Item>
              <Menu.Item
                key="view-specs"
                icon={<FileTextOutlined />}
                onClick={() => handleViewItemSpecs(record)}
              >
                View Item Specifications
              </Menu.Item>
              <Menu.Item
                key="generate-pdf"
                icon={<PrinterOutlined />}
                onClick={() => generatePDF(record)}
              >
                Generate PDF
              </Menu.Item>
              <Menu.Item
                key="view-notes"
                icon={<MessageOutlined />}
                onClick={() => handleViewNotes(record)}
              >
                View Notes
              </Menu.Item>
              <Menu.Item
                key="add-followup"
                icon={<ScheduleOutlined />}
                onClick={() => handleShowFollowUpDrawer(record)}
              >
                Add/View Follow-ups
              </Menu.Item>
              <Menu.Item
                key="view-payments"
                icon={<DollarOutlined />}
                onClick={() => handleViewPayments(record)}
              >
                View Payments
              </Menu.Item>
              {/* Edit Invoice - only if not closed */}
              {!record.isClosed && (
                <Menu.Item
                  key="edit"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                >
                  Edit Invoice
                </Menu.Item>
              )}
              {/* Lock/Unlock Invoice based on isClosed status */}
              {!record.isClosed ? (
                <Menu.Item
                  key="lock"
                  icon={<LockOutlined />}
                  onClick={() => {
                    // Custom confirmation modal (Ant Design Modal.confirm)
                    Modal.confirm({
                      title: "Close Invoice",
                      content:
                        "Are you sure you want to close this invoice? It will become uneditable.",
                      okText: "Yes, Close",
                      cancelText: "No",
                      okButtonProps: { danger: true }, // Style 'Yes' button as danger
                      onOk: () => handleCloseInvoice(record._id), // Call close handler on confirmation
                    });
                  }}
                >
                  Lock Invoice
                </Menu.Item>
              ) : (
                <Menu.Item
                  key="unlock"
                  icon={<UnlockOutlined />}
                  onClick={() => {
                    // Custom confirmation modal for unlocking
                    Modal.confirm({
                      title: "Unlock Invoice",
                      content:
                        "Are you sure you want to unlock this invoice? It will become editable again.",
                      okText: "Yes, Unlock",
                      cancelText: "No",
                      onOk: () => handleUnlockInvoice(record._id), // Call unlock handler on confirmation
                    });
                  }}
                >
                  Unlock Invoice
                </Menu.Item>
              )}
              {/* Delete Invoice: Corrected to use onDelete prop */}
              <Menu.Item
                key="delete" // Added a key for consistency
                icon={<DeleteOutlined />} // Added icon
              >
                <Popconfirm
                  title="Are you sure you want to delete this invoice?" // Changed text for clarity
                  onConfirm={() => onDelete(record._id)} // Corrected to use onDelete prop
                  okText="Yes"
                  cancelText="No"
                >
                  Delete Invoice
                </Popconfirm>
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]} // Dropdown triggers on click
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // Main component render
  return (
    <>
      <Card
        title="Invoice Management"
        extra={
          <Space wrap>
            {/* Date range picker for filtering invoices by date */}
            <RangePicker onChange={setDateRange} format="YYYY-MM-DD" />
            {/* Select dropdown for filtering by payment status */}
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="paid">Paid</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="partial">Partial</Select.Option>
              <Select.Option value="overdue">Overdue</Select.Option>
            </Select>
            {/* Select dropdown for filtering by business name */}
            <Select
              value={businessFilter}
              onChange={setBusinessFilter}
              placeholder="Filter by Business"
              style={{ width: 200 }}
              allowClear
            >
              <Select.Option value="all">All Businesses</Select.Option>
              {uniqueBusinessNames.map((name) => (
                <Select.Option key={name} value={name}>
                  {name}
                </Select.Option>
              ))}
            </Select>
            {/* Search input for filtering by invoice number, business name, or customer name */}
            <Input.Search
              placeholder="Search invoices"
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)} // Update search term on change
              style={{ width: 240 }}
              allowClear
              prefix={<SearchOutlined />}
            />
            {/* Button to export filtered invoices to Excel */}
            <Button onClick={exportToExcel}>Export Excel</Button>
            {/* Button to add a new invoice */}
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddNew}>
              New Invoice
            </Button>
          </Space>
        }
      >
        {/* Tabs for switching between Invoice and Proforma views */}
        {invoiceTypeTabs}
        {/* Main table displaying filtered invoices */}
        <Table
          dataSource={filteredInvoices}
          columns={columns}
          rowKey="_id" // Unique key for each row
          pagination={{ pageSize: 10 }} // Pagination settings
          bordered // Add borders to the table
          scroll={{ x: true }} // Enable horizontal scrolling for smaller screens
        />
      </Card>

      {/* Invoice Details Modal - displays comprehensive details of a selected invoice */}
      <Modal
        title="Invoice Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={
          <Button onClick={() => setViewModalVisible(false)}>Close</Button>
        }
        width={1000} // Increased width to accommodate items table
      >
        {selectedInvoice && (
          <div>
            {/* General invoice details */}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item
                label={
                  selectedInvoice.invoiceType === "Proforma"
                    ? "Proforma No"
                    : "Invoice No"
                }
              >
                {selectedInvoice.invoiceType === "Proforma"
                  ? selectedInvoice.proformaNumber
                  : selectedInvoice.invoiceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {selectedInvoice.invoiceType}
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {selectedInvoice.date
                  ? new Date(selectedInvoice.date).toLocaleDateString("en-IN")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {selectedInvoice.dueDate
                  ? new Date(selectedInvoice.dueDate).toLocaleDateString(
                      "en-IN"
                    )
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Business">
                {selectedInvoice.businessName}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {selectedInvoice.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN" span={2}>
                <Text code>{selectedInvoice.gstin || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Business Info" span={2}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {selectedInvoice.businessInfo || "N/A"}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Items Details Table - displays a detailed list of items in the invoice */}
            {selectedInvoice.items?.length > 0 && (
              <>
                <Divider orientation="left">
                  Items ({selectedInvoice.items.length})
                </Divider>
                <Table
                  dataSource={selectedInvoice.items}
                  columns={getItemsTableColumns()} // Use the function to get columns
                  pagination={false}
                  size="small"
                  rowKey={(item, idx) => `${selectedInvoice._id}-item-${idx}`} // Unique key for each item
                  bordered
                  expandable={{
                    expandedRowRender: (item) => (
                      <div style={{ margin: 0, padding: 0 }}>
                        {item.specifications?.length > 0 && (
                          <Descriptions column={1} size="small">
                            {item.specifications
                              .filter((spec) => spec.name !== "SPECIFICATION") // Exclude main SPECIFICATION if used for description
                              .map((spec, i) => (
                                <Descriptions.Item key={i} label={spec.name}>
                                  {spec.value}
                                </Descriptions.Item>
                              ))}
                          </Descriptions>
                        )}
                      </div>
                    ),
                    rowExpandable: (item) => item.specifications?.length > 0, // Enable expansion if specifications exist
                  }}
                  summary={(pageData) => {
                    const subTotal = pageData.reduce(
                      (sum, item) =>
                        sum + (item.quantity || 0) * (item.rate || 0),
                      0
                    );
                    const gstPercentage = selectedInvoice.gstPercentage || 0;
                    const gstType = selectedInvoice.gstType || "intrastate";
                    let totalGSTAmount = 0;
                    let cgstAmount = 0;
                    let sgstAmount = 0;
                    let igstAmount = 0;

                    if (gstType === "interstate") {
                      igstAmount = subTotal * (gstPercentage / 100);
                      totalGSTAmount = igstAmount;
                    } else {
                      cgstAmount = subTotal * (gstPercentage / 200);
                      sgstAmount = subTotal * (gstPercentage / 200);
                      totalGSTAmount = cgstAmount + sgstAmount;
                    }

                    const grandTotal = subTotal + totalGSTAmount;

                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell
                            index={0}
                            colSpan={5}
                            align="right"
                          >
                            <Text strong>Sub Total:</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5}>
                            <Text strong>{formatIndianCurrency(subTotal)}</Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                        {gstType === "interstate" ? (
                          <Table.Summary.Row>
                            <Table.Summary.Cell
                              index={0}
                              colSpan={5}
                              align="right"
                            >
                              <Text strong>IGST ({gstPercentage}%):</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5}>
                              <Text strong>
                                {formatIndianCurrency(igstAmount)}
                              </Text>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        ) : (
                          <>
                            <Table.Summary.Row>
                              <Table.Summary.Cell
                                index={0}
                                colSpan={5}
                                align="right"
                              >
                                <Text strong>CGST ({gstPercentage / 2}%):</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={5}>
                                <Text strong>
                                  {formatIndianCurrency(cgstAmount)}
                                </Text>
                              </Table.Summary.Cell>
                            </Table.Summary.Row>
                            <Table.Summary.Row>
                              <Table.Summary.Cell
                                index={0}
                                colSpan={5}
                                align="right"
                              >
                                <Text strong>SGST ({gstPercentage / 2}%):</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={5}>
                                <Text strong>
                                  {formatIndianCurrency(sgstAmount)}
                                </Text>
                              </Table.Summary.Cell>
                            </Table.Summary.Row>
                          </>
                        )}
                        <Table.Summary.Row>
                          <Table.Summary.Cell
                            index={0}
                            colSpan={5}
                            align="right"
                          >
                            <Text strong>Grand Total:</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5}>
                            <Text strong style={{ color: "#52c41a" }}>
                              {formatIndianCurrency(grandTotal)}
                            </Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={6}>
                            <Text italic>
                              Amount in words:{" "}
                              {numberToWords(Math.floor(grandTotal))} Rupees
                              Only
                            </Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    );
                  }}
                />
              </>
            )}

            {/* Amount Summary outside items table for overall total (keeping it here for consistency with original) */}
            <Descriptions
              column={2}
              bordered
              size="small"
              style={{ marginTop: "20px" }}
            >
              <Descriptions.Item label="Sub Total" span={2}>
                ₹{selectedInvoice.subTotal?.toFixed(2) || "0.00"}
              </Descriptions.Item>
              {selectedInvoice.gstType === "interstate" ? (
                <Descriptions.Item label="IGST Amount" span={2}>
                  ₹{selectedInvoice.igstAmount?.toFixed(2) || "0.00"}
                </Descriptions.Item>
              ) : (
                <>
                  <Descriptions.Item label="CGST Amount" span={1}>
                    ₹{selectedInvoice.cgstAmount?.toFixed(2) || "0.00"}
                  </Descriptions.Item>
                  <Descriptions.Item label="SGST Amount" span={1}>
                    ₹{selectedInvoice.sgstAmount?.toFixed(2) || "0.00"}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Grand Total" span={2}>
                <Text strong style={{ fontSize: "18px", color: "#52c41a" }}>
                  ₹{selectedInvoice.totalAmount?.toFixed(2) || "0.00"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Amount in Words" span={2}>
                <Text italic>
                  {numberToWords(Math.floor(selectedInvoice.totalAmount || 0))}{" "}
                  Rupees Only
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                {getStatusTag(invoiceStatusMap[selectedInvoice._id])} {/* Use calculated status here */}
              </Descriptions.Item>
              <Descriptions.Item label="Closed" span={2}>
                {selectedInvoice.isClosed ? (
                  <Tag color="red">Yes</Tag>
                ) : (
                  <Tag color="green">No</Tag>
                )}
              </Descriptions.Item>
              {/* NEW: Display conversion status in modal for Proforma invoices */}
              {selectedInvoice.invoiceType === "Proforma" && (
                <Descriptions.Item label="Conversion Status" span={2}>
                  <Tag
                    color={
                      selectedInvoice.conversionStatus === "converted"
                        ? "green"
                        : selectedInvoice.conversionStatus === "rejected"
                        ? "red"
                        : "blue"
                    }
                  >
                    {selectedInvoice.conversionStatus === "converted"
                      ? "Converted"
                      : selectedInvoice.conversionStatus === "rejected"
                      ? "Rejected"
                      : "Pending Conversion"}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Display notes associated with the invoice */}
            {selectedInvoice.notes?.length > 0 && (
              <>
                <Divider orientation="left">
                  Notes ({selectedInvoice.notes.length})
                </Divider>
                {selectedInvoice.notes.map((note, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <Text strong>{note.author}</Text> on{" "}
                    <Text type="secondary">{note.timestamp}</Text>
                    <p>{note.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Item View Modal - specifically for viewing item specifications */}
      <Modal
        title="Item Specifications"
        open={itemViewModalVisible}
        onCancel={() => setItemViewModalVisible(false)}
        footer={
          <Button onClick={() => setItemViewModalVisible(false)}>Close</Button>
        }
        width={800}
      >
        {selectedInvoice && selectedInvoice.items && (
          <List
            itemLayout="vertical"
            dataSource={selectedInvoice.items}
            renderItem={(item, index) => (
              <List.Item key={index}>
                <List.Item.Meta
                  title={
                    <Text strong>{item.description || "No Description"}</Text>
                  }
                  description={
                    <>
                      <Text>Quantity: {item.quantity}</Text>
                      <br />
                      <Text>Rate: ₹{formatIndianCurrency(item.rate)}</Text>
                      <br />
                      {item.hsnSac && <Text>HSN/SAC: {item.hsnSac}</Text>}
                      {item.specifications &&
                        item.specifications.length > 0 && (
                          <>
                            <br />
                            <Text strong>Specifications:</Text>
                            <ul>
                              {item.specifications.map((spec, specIndex) => (
                                <li key={specIndex}>
                                  {spec.name}: {spec.value}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Notes Drawer - for adding/viewing notes */}
      {selectedInvoice && (
        <NotesDrawer
          visible={notesDrawerVisible}
          onClose={() => setNotesDrawerVisible(false)}
          invoice={selectedInvoice}
          refreshInvoices={refreshInvoices}
        />
      )}

      {/* Follow-up Drawer - for managing follow-ups */}
      {selectedInvoice && (
        <FollowUpDrawer
          visible={followUpDrawerVisible}
          onClose={() => setFollowUpDrawerVisible(false)}
          invoice={selectedInvoice}
          refreshInvoices={refreshInvoices}
        />
      )}

      {/* Payment History Drawer - for viewing/managing payment history */}
      <PaymentHistoryDrawer
        visible={paymentDrawerVisible}
        onClose={() => setPaymentDrawerVisible(false)}
        invoice={selectedInvoice}
        refreshInvoices={refreshInvoices}
      />
    </>
  );
};

export default InvoiceList;
