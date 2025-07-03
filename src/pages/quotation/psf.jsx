import React, { useRef, useState } from "react";
import {
  Space,
  Table,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Drawer,
  Select,
  Form,
  Card,
  Tag,
  Modal,
  Spin,
} from "antd";
import { useGetCustomersQuery } from "../Redux/CustomerSlice";
import { useGetCategoriesQuery } from "../Redux/CategorySlice";
import { useGetProductsQuery } from "../Redux/ProductSlice";
import {
  useCreateQuotationMutation,
  useGetQoutatuionsQuery,
  useUpdateQuotationStatusMutation,
} from "../Redux/QoutationSlice";
import Logo from '../assets/Images/logo.jpg'
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FilePdfOutlined, PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

const Quotation = () => {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("large");
  const [modal2Open, setModal2Open] = useState(false);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [gstTypeMap, setGstTypeMap] = useState({});
  const [filteredProducts, setFilteredProducts] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [loaderText, setLoaderText] = useState("Loading...");
  const [percent, setPercent] = useState(0);
  const [pdfDrawerOpen, setPdfDrawerOpen] = useState(false);
  const [pdfRecord, setPdfRecord] = useState(null);

  const pdfRef = useRef();
  const firstPartRef = useRef();
  const secondPartRef = useRef();

  const [dateRange, setDateRange] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");

  const showLargeDrawer = () => {
    setSize("large");
    setOpen(true);
  };

  const onClose = () => setOpen(false);

  const [form] = Form.useForm();

  const {
    data: customerData,
    isLoading: isCustomerLoading,
    refetch: refetchCustomer,
  } = useGetCustomersQuery({ page: 1, itemsPerPage: 100, search: "" });
  const customerList = customerData?.customer || [];

  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: productData } = useGetProductsQuery({ page: 1, itemsPerPage: 100 });

  const productsByCategory = {};

  (productData?.product || []).forEach((product) => {
    let categoryId = "";
    if (typeof product.category === "object" && product.category !== null) {
      categoryId = product.category._id;
    } else {
      categoryId = product.category;
    }
    if (!productsByCategory[categoryId]) {
      productsByCategory[categoryId] = [];
    }
    productsByCategory[categoryId].push({
      label: product.name,
      value: product._id,
      description: product.description,
      rate: product.price,
      hsnCode: product.hsnCode,
    });
  });

  const handleCategoryChange = (categoryId, index) => {
    setFilteredProducts((prev) => ({
      ...prev,
      [index]: productsByCategory[categoryId] || [],
    }));
    const currentItems = form.getFieldValue("items") || [];
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      productId: undefined,
      description: [],
      rate: "",
      hsnCode: "",
    };
    form.setFieldsValue({ items: updatedItems });
  };

  const handleProductChange = (productId, index) => {
    const selectedProduct = (productData?.product || []).find((p) => p._id === productId);
    if (selectedProduct) {
      const currentItems = form.getFieldValue("items") || [];
      const updatedItems = [...currentItems];
      updatedItems[index] = {
        ...updatedItems[index],
        productId: selectedProduct._id,
        productDescription: selectedProduct.description || [],
        description: selectedProduct.description || [],
        rate: selectedProduct.price,
        hsnCode: selectedProduct.hsnCode,
      };
      form.setFieldsValue({ items: updatedItems });
      setTimeout(calculateTotals, 0);
    }
  };

  const handleCustomerChange = (selectedId) => {
    const selectedCustomer = customerList.find((c) => c._id === selectedId);
    if (selectedCustomer) {
      const customerItems = selectedCustomer.items || [];
      const formattedItems = customerItems.map((item, index) => {
        const productObj = (productData?.product || []).find(
          (p) => p._id === (item.productId?._id || item.productId)
        );
        const categoryObj = (categoriesData?.categories || []).find(
          (cat) => cat._id === (productObj?.category?._id || productObj?.category)
        );
        const categoryId = categoryObj?._id || item.productId?.category;

        setFilteredProducts((prev) => ({
          ...prev,
          [index]: productsByCategory[categoryId] || [],
        }));

        return {
          productCategory: categoryId,
          productId: productObj?._id || item.productId,
          description: item.description || [],
          quantity: item.quantity,
          rate: item.rate,
          hsnCode: item.hsnCode,
          gstType: item.gstType,
          igst: item.gstType === "IGST" ? item.igst : undefined,
          sgst: item.gstType === "SGST+CGST" ? item.sgst : undefined,
          cgst: item.gstType === "SGST+CGST" ? item.cgst : undefined,
          total: item.total,
        };
      });

      form.setFieldsValue({
        customerId: selectedCustomer._id,
        fullName: selectedCustomer.fullName,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        company: selectedCustomer.company,
        address: selectedCustomer.address,
        landmark: selectedCustomer.landmark,
        pincode: selectedCustomer.pincode,
        businessName: selectedCustomer.businessName,
        gstNumber: selectedCustomer.gstNumber,
        Validity: selectedCustomer.Validity || 15,
        Delivery: selectedCustomer.Delivery || 15,
        Warranty: selectedCustomer.Warranty || 1,
        Payment: selectedCustomer.Payment,
        Freight: selectedCustomer.Freight,
        Notes: selectedCustomer.Notes,
        items: formattedItems,
      });

      setTimeout(() => {
        const gstMap = {};
        customerItems.forEach((item, index) => {
          gstMap[index] = item.gstType;
        });
        setGstTypeMap(gstMap);
        calculateTotals();
      }, 100);
    } else {
      form.resetFields();
    }
  };

  const handleGstChange = (value, index) => {
    setGstTypeMap((prev) => ({ ...prev, [index]: value }));
    const currentItems = form.getFieldValue("items") || [];
    const updatedItems = [...currentItems];

    if (value === "IGST") {
      updatedItems[index] = {
        ...updatedItems[index],
        igst: updatedItems[index]?.igst || 18,
        sgst: undefined,
        cgst: undefined,
      };
    } else if (value === "SGST+CGST") {
      updatedItems[index] = {
        ...updatedItems[index],
        sgst: updatedItems[index]?.sgst || 9,
        cgst: updatedItems[index]?.cgst || 9,
        igst: undefined,
      };
    }

    form.setFieldsValue({ items: updatedItems });
    setTimeout(calculateTotals, 0);
  };

  const calculateTotals = () => {
    const items = form.getFieldValue("items") || [];
    let totalAmount = 0;
    let totalIGST = 0;
    let totalSGST = 0;
    let totalCGST = 0;

    const updatedItems = items.map((item) => {
      const quantity = parseFloat(item.quantity || 0);
      const rate = parseFloat(item.rate || 0);
      const gstType = item.gstType;
      const igst = parseFloat(item.igst || 0);
      const sgst = parseFloat(item.sgst || 0);
      const cgst = parseFloat(item.cgst || 0);

      const baseAmount = quantity * rate;
      let itemTotal = baseAmount;

      if (gstType === "IGST") {
        const tax = (baseAmount * igst) / 100;
        totalIGST += tax;
        itemTotal += tax;
      } else if (gstType === "SGST+CGST") {
        const taxSGST = (baseAmount * sgst) / 100;
        const taxCGST = (baseAmount * cgst) / 100;
        totalSGST += taxSGST;
        totalCGST += taxCGST;
        itemTotal += taxSGST + taxCGST;
      }

      totalAmount += itemTotal;

      return {
        ...item,
        total: parseFloat(itemTotal.toFixed(2)),
      };
    });

    form.setFieldsValue({
      items: updatedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalIGST: parseFloat(totalIGST.toFixed(2)),
      totalSGST: parseFloat(totalSGST.toFixed(2)),
      totalCGST: parseFloat(totalCGST.toFixed(2)),
    });
  };

  const [createQuotation] = useCreateQuotationMutation();

  const {
    data: quotationData,
    isLoading: isQuotationLoading,
    refetch: refetchQuotation,
  } = useGetQoutatuionsQuery(
    {
      page: currentPage,
      itemsPerPage,
      search: searchQuery,
      startDate: dateRange?.[0]?.toISOString() || "",
      endDate: dateRange?.[1]?.toISOString() || "",
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
    }
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const dataSource = quotationData?.Quotation?.map((q, index) => {
    const itemsDescription = q.items
      .map((item) => {
        const quantity = item.quantity || 0;
        const rate = item.rate || 0;
        const baseAmount = quantity * rate;
        let gstLabel = "";
        let gstAmount = 0;

        if (item.gstType === "IGST") {
          const igst = item.igst || 0;
          gstLabel = IGST ${igst}%;
          gstAmount = (baseAmount * igst) / 100;
        } else if (item.gstType === "SGST+CGST") {
          const sgst = item.sgst || 0;
          const cgst = item.cgst || 0;
          gstLabel = SGST ${sgst}% + CGST ${cgst}%;
          gstAmount = (baseAmount * (sgst + cgst)) / 100;
        }

        const total = item.total || baseAmount + gstAmount;

        return • ${item.productName} (Qty: ${quantity}, Rate: ₹${rate}, ${gstLabel}, GST Amt: ₹${gstAmount.toFixed(2)}, Total: ₹${total});
      })
      .join("\n");

    return {
      key: q._id,
      index: (currentPage - 1) * itemsPerPage + index + 1,
      quotationNumber: q.quotationNumber,
      fullName: q.customerInfo?.fullName,
      phone: q.customerInfo?.phone,
      businessName: q.customerInfo?.businessName,
      landmark: q.customerInfo?.landmark,
      address: q.customerInfo?.address,
      status: q.status,
      rejectionReason: q.rejectionReason,
      items: itemsDescription,
    };
  }) || [];

  const [updateQuotationStatus] = useUpdateQuotationStatusMutation();

  const getStatusTag = (status) => {
    let color = "#A62C2C";
    let textColor = "#fff";

    if (status === "approved") {
      color = "#1F7D53";
    } else if (status === "rejected") {
      color = "#D84040";
    } else if (status === "pending") {
      color = "#ECE852";
      textColor = "#000";
    }

    return (
      <Tag
        color={color}
        style={{
          cursor: "pointer",
          fontSize: "14px",
          padding: "5px",
          color: textColor,
        }}
      >
        {status.toUpperCase()}
      </Tag>
    );
  };

  const getStatusTagCount = (status) => {
    if (!quotationData?.Quotation) return 0;
    return quotationData.Quotation.filter((q) => q.status === status).length;
  };

  const getTotalQuotationCount = () => {
    return quotationData?.Quotation?.length || 0;
  };

  const handleDownloadPDF = async () => {
    const firstInput = firstPartRef.current;
    const secondInput = secondPartRef.current;

    if (!firstInput || !secondInput) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm for A4
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm for A4
    const margin = 15; // 15mm margin on left and right
    const contentWidth = pageWidth - 2 * margin; // Width after margins

    // Capture First Part
    const firstCanvas = await html2canvas(firstInput, { scale: 2 });
    const firstImgData = firstCanvas.toDataURL('image/png');
    const firstImgHeight = (firstCanvas.height * contentWidth) / firstCanvas.width;

    let heightLeft = firstImgHeight;
    let position = 0;

    pdf.addImage(firstImgData, 'PNG', margin, position, contentWidth, firstImgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - firstImgHeight;
      pdf.addPage();
      pdf.addImage(firstImgData, 'PNG', margin, position, contentWidth, firstImgHeight);
      heightLeft -= pageHeight;
    }

    // Add Second Part on new page
    pdf.addPage();
    const secondCanvas = await html2canvas(secondInput, { scale: 2 });
    const secondImgData = secondCanvas.toDataURL('image/png');
    const secondImgHeight = (secondCanvas.height * contentWidth) / secondCanvas.width;

    heightLeft = secondImgHeight;
    position = 0;

    pdf.addImage(secondImgData, 'PNG', margin, position, contentWidth, secondImgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - secondImgHeight;
      pdf.addPage();
      pdf.addImage(secondImgData, 'PNG', margin, position, contentWidth, secondImgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(Quotation_${pdfRecord?.quotationNumber || "document"}.pdf);
  };

  const columns = [
    { title: "S.NO", dataIndex: "index", key: "index" },
    { title: "Quotation Number", dataIndex: "quotationNumber", key: "quotationNumber" },
    { title: "Full Name", dataIndex: "fullName", key: "fullName" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Business Name", dataIndex: "businessName", key: "businessName" },
    { title: "Landmark", dataIndex: "landmark", key: "landmark" },
    { title: "Address", dataIndex: "address", key: "address" },
    {
      title: "PDF",
      key: "pdf",
      render: (_, record) => {
        const fullRecord = quotationData?.Quotation?.find((q) => q._id === record.key);
        return (
          <Button
            type="link"
            onClick={() => {
              setPdfRecord(fullRecord);
              setPdfDrawerOpen(true);
            }}
          >
            <FilePdfOutlined style={{ fontSize: "25px", color: "red" }} />
          </Button>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text, record) => {
        const isRejected = record.status === "rejected";
        return (
          <div
            onClick={() => {
              if (!isRejected) {
                setSelectedRecord(record);
                setSelectedStatus(record.status);
                setModal2Open(true);
              }
            }}
            style={{
              cursor: isRejected ? "not-allowed" : "pointer",
              opacity: isRejected ? 0.5 : 1,
            }}
          >
            {getStatusTag(text)}
          </div>
        );
      },
    },
    { title: "Reason", dataIndex: "rejectionReason", key: "rejectionReason" },
  ];

  const clearFilter = () => {
    setDateRange([]);
    setSearchQuery("");
    refetchQuotation();
  };

  const onFinish = async (values) => {
    let ptg = -10;
    setSpinning(true);
    setLoaderText("Updating...");
    const interval = setInterval(() => {
      ptg += 5;
      setPercent(ptg);
    }, 1000);
    try {
      await createQuotation(values).unwrap();
      form.resetFields();
      setOpen(false);
    } catch (error) {
      console.error("Quotation submission failed", error);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setSpinning(false);
        setPercent(0);
        setLoaderText("Loading...");
      }, 500);
    }
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    if (value === "rejected") {
      setModal2Open(false);
      setReasonModalOpen(true);
    }
  };

  const handleReasonSubmit = async () => {
    if (!rejectionReason.trim()) {
      return;
    }
    let ptg = -10;
    setSpinning(true);
    const interval = setInterval(() => {
      ptg += 5;
      setPercent(ptg);
    }, 100);
    try {
      const quotationId = selectedRecord.key;
      await updateQuotationStatus({
        id: quotationId,
        status: selectedStatus,
        rejectionReason,
      }).unwrap();
      refetchQuotation();
      setReasonModalOpen(false);
      setRejectionReason("");
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      clearInterval(interval);
      setSpinning(false);
      setPercent(0);
    }
  };

  return (
    <Spin spinning={spinning} tip={${loaderText} ${percent}%} size="large">
      <div>
        <h1>Quotations</h1>

        <Row gutter={16} style={{ marginTop: "20px", marginBottom: "20px" }}>
          <Col span={6}>
            <Card
              title="Total Quotation"
              variant="borderless"
              style={{ backgroundColor: "#4096ff", color: "white" }}
            >
              {getTotalQuotationCount()}
            </Card>
          </Col>
          <Col span={6}>
            <Card
              title="Total Pending"
              variant="borderless"
              style={{ backgroundColor: "#102E50", color: "white" }}
            >
              {getStatusTagCount("pending")}
            </Card>
          </Col>
          <Col span={6}>
            <Card
              title="Total Approved"
              variant="borderless"
              style={{ backgroundColor: "#1F7D53", color: "white" }}
            >
              {getStatusTagCount("approved")}
            </Card>
          </Col>
          <Col span={6}>
            <Card
              title="Total Rejected"
              variant="borderless"
              style={{ backgroundColor: "#E83F25", color: "white" }}
            >
              {getStatusTagCount("rejected")}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col md={24} lg={12}>
            <Input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Col>
          <Col md={24} lg={12}>
            <Space style={{ width: "100%", justifyContent: "flex-start" }}>
              <Button type="primary" onClick={showLargeDrawer} style={{ padding: "21px" }}>
                Create Quotation
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
          <Col md={6} lg={6}>
            <RangePicker
              style={{ width: "100%" }}
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              value={dateRange}
              onChange={(value) => setDateRange(value)}
            />
          </Col>
          <Col md={12} lg={12}>
            <Button type="primary" onClick={clearFilter}>
              Clear Filter
            </Button>
          </Col>
        </Row>

        <Row>
          <Col md={24} sm={24}>
            <Table
              loading={isQuotationLoading}
              dataSource={dataSource}
              columns={columns}
              style={{ marginTop: "25px", overflowX: "auto" }}
              pagination={{
                current: currentPage,
                pageSize: itemsPerPage,
                total: quotationData?.pagination?.totalQuotation || 0,
                onChange: handlePageChange,
              }}
            />
          </Col>
        </Row>

        <Drawer title="Create Quotation" placement="right" size={size} onClose={onClose} open={open}>
          <Card style={{ width: "100%", boxShadow: "unset" }}>
            <Form layout="vertical" form={form} id="quotationForm" onFinish={onFinish}>
              <Form.Item
                name="customerId"
                rules={[{ required: true, message: "Please select a customer" }]}
              >
                <Select
                  placeholder="Select customer"
                  allowClear
                  loading={isCustomerLoading}
                  onChange={(value) => handleCustomerChange(value)}
                >
                  {customerList.map((c) => (
                    <Select.Option key={c._id} value={c._id}>
                      {c.fullName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {form.getFieldValue("customerId") && (
                <Row gutter={16} style={{ marginBottom: "16px", backgroundColor: "#fafafa" }}>
                  <Col
                    span={12}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "200px",
                      textAlign: "center",
                      borderRight: "1px solid #ddd",
                    }}
                  >
                    <h3>Business Info</h3>
                  </Col>
                  <Col
                    span={12}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "200px",
                    }}
                  >
                    <ul style={{ listStyleType: "none", padding: 0 }}>
                      <li>
                        <strong>Full Name :</strong> {form.getFieldValue("fullName") || "-"}
                      </li>
                      <li>
                        <strong>Email :</strong> {form.getFieldValue("email") || "-"}
                      </li>
                      <li>
                        <strong>Phone :</strong> {form.getFieldValue("phone") || "-"}
                      </li>
                      <li>
                        <strong>Business Name :</strong>{" "}
                        {form.getFieldValue("businessName") || "-"}
                      </li>
                      <li>
                        <strong>Landmark :</strong> {form.getFieldValue("landmark") || "-"}
                      </li>
                      <li>
                        <strong>Address :</strong> {form.getFieldValue("address") || "-"}
                      </li>
                    </ul>
                  </Col>
                </Row>
              )}

              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space
                        key={key}
                        style={{ display: "flex", marginBottom: 8 }}
                        align="baseline"
                        wrap
                      >
                        <Row gutter={16} style={{ width: "100%" }}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "productCategory"]}
                              rules={[{ required: true, message: "Please select a category" }]}
                            >
                              <Select
                                placeholder="Select Category"
                                options={(categoriesData?.categories || []).map((cat) => ({
                                  label: cat.name,
                                  value: cat._id,
                                }))}
                                onChange={(value) => handleCategoryChange(value, name)}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "productId"]}
                              rules={[{ required: true, message: "Please select a product" }]}
                            >
                              <Select
                                placeholder="Select Product"
                                options={filteredProducts[name] || []}
                                onChange={(value) => handleProductChange(value, name)}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item label="Product Specification">
                          <Form.List name={[name, "description"]}>
                            {(descFields, { add: addDesc, remove: removeDesc }) => (
                              <>
                                {descFields.map(({ key: descKey, name: descName, ...descRestField }) => (
                                  <Space
                                    key={descKey}
                                    style={{ display: "flex", marginBottom: 8 }}
                                    align="baseline"
                                  >
                                    <Form.Item
                                      {...descRestField}
                                      name={[descName, "type"]}
                                      rules={[{ required: true, message: "Missing Type" }]}
                                    >
                                      <Input placeholder="Type" />
                                    </Form.Item>
                                    <Form.Item
                                      {...descRestField}
                                      name={[descName, "specification"]}
                                      rules={[{ required: true, message: "Missing Specification" }]}
                                    >
                                      <Input placeholder="Specification" />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => removeDesc(descName)} />
                                  </Space>
                                ))}
                                <Form.Item>
                                  <Button
                                    type="dashed"
                                    onClick={() => addDesc()}
                                    block
                                    icon={<PlusOutlined />}
                                  >
                                    Add Specification
                                  </Button>
                                </Form.Item>
                              </>
                            )}
                          </Form.List>
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          rules={[{ required: true, message: "Please enter quantity" }]}
                        >
                          <Input type="number" placeholder="Qty" onChange={calculateTotals} />
                        </Form.Item>

                        <Form.Item {...restField} name={[name, "rate"]}>
                          <Input type="number" placeholder="Rate" />
                        </Form.Item>

                        <Form.Item {...restField} name={[name, "hsnCode"]}>
                          <Input placeholder="HSN Code" />
                        </Form.Item>

                        <Row>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "gstType"]}
                              initialValue="IGST"
                              rules={[{ required: true, message: "Please select GST type" }]}
                            >
                              <Select
                                onChange={(value) => {
                                  handleGstChange(value, name);
                                  setTimeout(calculateTotals, 0);
                                }}
                                options={[
                                  { label: "IGST", value: "IGST" },
                                  { label: "SGST+CGST", value: "SGST+CGST" },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        {gstTypeMap[name] === "IGST" ? (
                          <Form.Item {...restField} name={[name, "igst"]}>
                            <Input type="number" placeholder="IGST" />
                          </Form.Item>
                        ) : (
                          <>
                            <Row>
                              <Col span={12} style={{ padding: "5px" }}>
                                <Form.Item {...restField} name={[name, "sgst"]}>
                                  <Input type="number" placeholder="SGST" />
                                </Form.Item>
                              </Col>
                              <Col span={12} style={{ padding: "5px" }}>
                                <Form.Item {...restField} name={[name, "cgst"]}>
                                  <Input type="number" placeholder="CGST" />
                                </Form.Item>
                              </Col>
                            </Row>
                          </>
                        )}

                        <Form.Item {...restField} name={[name, "total"]}>
                          <Input type="number" placeholder="Item Total" />
                        </Form.Item>

                        <Button onClick={() => remove(name)} type="dashed" danger>
                          Remove
                        </Button>
                      </Space>
                    ))}

                    <Form.Item>
                      <Button
                        type="dashed"
                        block
                        onClick={() => {
                          add({
                            gstType: "IGST",
                            igst: 18,
                            quantity: 1,
                          });
                          setTimeout(calculateTotals, 0);
                        }}
                      >
                        Add Item
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="Validity"
                    label="Validity (Days)"
                    rules={[{ required: true, message: "Please input validity days" }]}
                    initialValue={15}
                  >
                    <Input type="number" placeholder="Validity Days" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="Delivery"
                    label="Delivery (Days)"
                    rules={[{ required: true, message: "Please input delivery days" }]}
                    initialValue={15}
                  >
                    <Input type="number" placeholder="Delivery Days" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="Warranty"
                    label="Warranty (Years)"
                    rules={[{ required: true, message: "Please input warranty years" }]}
                    initialValue={1}
                  >
                    <Input type="number" placeholder="Warranty Years" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="Payment"
                    label="Payment Terms"
                    rules={[{ required: true, message: "Please input payment terms" }]}
                  >
                    <Input placeholder="Payment Terms" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="Freight"
                    label="Freight Terms"
                    rules={[{ required: true, message: "Please input freight terms" }]}
                  >
                    <Input placeholder="Freight Terms" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="Notes"
                label="Notes"
                rules={[{ required: true, message: "Please input notes" }]}
              >
                <Input.TextArea placeholder="Notes" />
              </Form.Item>

              <Form.Item name="gstNumber">
                <Input placeholder="GST Number" />
              </Form.Item>

              <Form.Item name="status" initialValue="pending">
                <Select
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Save Quotation
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Drawer>

        <Modal
          title="Update Status"
          centered
          open={modal2Open}
          onOk={() => {
            if (selectedStatus !== "rejected") {
              let ptg = -10;
              setSpinning(true);
              const interval = setInterval(() => {
                ptg += 5;
                setPercent(ptg);
              }, 100);
              try {
                const quotationId = selectedRecord.key;
                updateQuotationStatus({ id: quotationId, status: selectedStatus }).unwrap();
                refetchQuotation();
                setModal2Open(false);
              } catch (err) {
                console.error("Failed to update status:", err);
              } finally {
                clearInterval(interval);
                setSpinning(false);
                setPercent(0);
              }
            }
          }}
          onCancel={() => setModal2Open(false)}
        >
          <p>
            Change status for: <b>{selectedRecord?.quotationNumber}</b>
          </p>
          <Select
            value={selectedStatus}
            onChange={handleStatusChange}
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
          <br />
          <br />
        </Modal>

        <Modal
          title="Rejection Reason"
          centered
          open={reasonModalOpen}
          onOk={handleReasonSubmit}
          onCancel={() => {
            setReasonModalOpen(false);
            setRejectionReason("");
            setSelectedStatus(selectedRecord?.status || "pending");
          }}
          okButtonProps={{ disabled: !rejectionReason.trim() }}
        >
          <p>Please provide the reason for rejecting this quotation:</p>
          <Input.TextArea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason"
          />
        </Modal>

        <Drawer
          className="custom-drawer-pdf"
          title={null}
          placement="right"
          width={800}
          onClose={() => setPdfDrawerOpen(false)}
          open={pdfDrawerOpen}
        >
          <center>
            <Button onClick={handleDownloadPDF} style={{ marginBottom: "20px" }} type="primary">
              Download PDF
            </Button>
          </center>
          {pdfRecord ? (
            <div ref={pdfRef} style={{ padding: "20mm", background: "white" }}>
              <div ref={firstPartRef}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: "25%" }}>
                    <img src={Logo} alt="" style={{ width: "100%" }} />
                  </div>
                     <div style={{ width: "50%", textAlign: "center" }}>
                    <h2>GLOSUN ELECTRONIC PRIVATE LIMITED</h2>
                    <p>
                      25, Sridevi Nagar, K.N Palayam, Thoppampatti Post, Coimbatore-641017. Tamilnadu., Tamil Nadu, 641011<br />
                      +91 9786999001

<br />
                      info@acculermedia.com<br />
                      <strong>GST No:</strong> 33AAGCD0352B1ZF
                    </p>
                  </div>
                  <div style={{ width: "25%", textAlign: "right", marginTop: "50px" }}>
                    <h1>QUOTATION</h1>
                  </div>
                </div>

                <hr />

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                  <div>
                    <p><strong>Company Name:</strong> {pdfRecord.customerInfo?.businessName}</p>
                    <p><strong>Contact Person:</strong> {pdfRecord.customerInfo?.fullName}</p>
                    <p><strong>Contact Number:</strong> {pdfRecord.customerInfo?.phone}</p>
                    <p><strong>Address:</strong> {pdfRecord.customerInfo?.address}</p>
                  </div>
                  <div>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(pdfRecord.createdAt).toLocaleDateString("en-GB")}
                    </p>
                    <p><strong>Quotation Number:</strong> {pdfRecord.quotationNumber}</p>
                  </div>
                </div>

                <hr />

                <table
                  style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", border: "1px solid black" }}
                >
                  <thead>
                    <tr style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                      <th style={{ border: "1px solid black", padding: "5px" }}>S.No</th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>Product Name</th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>HSN Code</th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>Quantity</th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>Rate</th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>IGST</th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>SGST</th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>CGST</th>
                      <th style={{ border: "1px solid black", padding: "5px" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdfRecord.items.map((item, idx) => (
                      <tr style={{ border: "1px solid black", padding: "5px" }} key={item._id}>
                        <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                          {idx + 1}
                        </td>
                        <td style={{ border: "1px solid black", padding: "5px" }}>{item.productName}</td>
                        <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                          {item.hsnCode}
                        </td>
                        <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                          {item.quantity}
                        </td>
                        <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                          ₹{item.rate}
                        </td>
                        <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                          {item.igst ? ${item.igst}% : "-"}
                        </td>
                        <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                          {item.sgst ? ${item.sgst}% : "-"}
                        </td>
                        <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                          {item.cgst ? ${item.cgst}% : "-"}
                        </td>
                        <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                          ₹{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "right", paddingRight: "10px", border: "1px solid black", padding: "5px" }}
                      >
                        <strong>Without GST Amount:</strong>
                      </td>
                      <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                        ₹{((pdfRecord.totalAmount || 0) - (pdfRecord.totalIGST || 0) - (pdfRecord.totalSGST || 0) - (pdfRecord.totalCGST || 0)).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "right", paddingRight: "10px", border: "1px solid black", padding: "5px" }}
                      >
                        <strong>IGST:</strong>
                      </td>
                      <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                        ₹{pdfRecord.totalIGST?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "right", paddingRight: "10px", border: "1px solid black", padding: "5px" }}
                      >
                        <strong>SGST:</strong>
                      </td>
                      <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                        ₹{pdfRecord.totalSGST?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "right", paddingRight: "10px", border: "1px solid black", padding: "5px" }}
                      >
                        <strong>CGST:</strong>
                      </td>
                      <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                        ₹{pdfRecord.totalCGST?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "right", paddingRight: "10px", border: "1px solid black", padding: "5px" }}
                      >
                        <strong>Total Amount:</strong>
                      </td>
                      <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                        ₹{pdfRecord.totalAmount?.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "right", paddingRight: "10px", border: "1px solid black", padding: "5px" }}
                      >
                        <strong>Status:</strong>
                      </td>
                      <td style={{ textAlign: "center", border: "1px solid black", padding: "5px" }}>
                        {pdfRecord.status}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: "20px" }}>
                  <p><strong>Amount in Words:</strong> {pdfRecord.amountInWords || "-"}</p>
                </div>

                <div style={{ marginTop: 30, border: "1px solid #ccc", padding: "10px" }}>
                  <p>
                    We hope that you may satisfy with our prices and the specification. We expect
                    your valuable order in this regard.
                  </p>
                  <br />
                  <p>With Best Regards</p>
                  <br />
                  <p>For AcculerMedia</p>
                  <p style={{ display: "flex", justifyContent: "flex-end", marginTop: "-20px" }}>
                    Authorized Signatory
                  </p>
                </div>
              </div>

              <div ref={secondPartRef} style={{ marginTop: "20mm" }}>
                <div style={{ pageBreakBefore: "always" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ width: "25%" }}>
                      <img src={Logo} alt="" style={{ width: "100%" }} />
                    </div>
                       <div style={{ width: "50%", textAlign: "center" }}>
                    <h2>GLOSUN ELECTRONIC PRIVATE LIMITED</h2>
                    <p>
                      25, Sridevi Nagar, K.N Palayam, Thoppampatti Post, Coimbatore-641017. Tamilnadu., Tamil Nadu, 641011<br />
                      +91 9786999001

<br />
                      info@acculermedia.com<br />
                      <strong>GST No:</strong> 33AAGCD0352B1ZF
                    </p>
                  </div>
                    <div style={{ width: "25%", textAlign: "right", marginTop: "50px" }}>
                      <h1>QUOTATION</h1>
                    </div>
                  </div>

                  <hr />

                  <h2 style={{ textAlign: "center" }}>Product Specifications & Terms and Conditions</h2>

                  <table
                    style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", border: "1px solid black" }}
                  >
                    <thead>
                      <tr style={{ border: "1px solid black", padding: "5px" }}>
                        <th style={{ width: "40%", border: "1px solid black", padding: "5px" }}>
                          Condition
                        </th>
                        <th style={{ width: "60%", border: "1px solid black", padding: "5px" }}>
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pdfRecord.items.map((item) => (
                        <React.Fragment key={item._id}>
                          <tr style={{ border: "1px solid black", padding: "5px" }}>
                            <td
                              colSpan="2"
                              style={{
                                fontWeight: "bold",
                                backgroundColor: "#f0f0f0",
                                border: "1px solid black",
                                padding: "5px",
                              }}
                            >
                              {item.productName}
                            </td>
                          </tr>
                          {item.description?.map((desc, idx) => (
                            <React.Fragment key={idx}>
                              <tr style={{ border: "1px solid black", padding: "5px" }}>
                                <td style={{ border: "1px solid black", padding: "5px" }}>Type</td>
                                <td style={{ border: "1px solid black", padding: "5px" }}>
                                  {desc.type}
                                </td>
                              </tr>
                              <tr style={{ border: "1px solid black", padding: "5px" }}>
                                <td style={{ border: "1px solid black", padding: "5px" }}>
                                  Specification
                                </td>
                                <td style={{ border: "1px solid black", padding: "5px" }}>
                                  {desc.specification}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr style={{ border: "1px solid black", padding: "5px" }}>
                        <td style={{ border: "1px solid black", padding: "5px" }}>Payment Terms</td>
                        <td style={{ border: "1px solid black", padding: "5px" }}>
                          {pdfRecord.Payment || "50% advance, 50% on delivery"}
                        </td>
                      </tr>
                      <tr style={{ border: "1px solid black", padding: "5px" }}>
                        <td style={{ border: "1px solid black", padding: "5px" }}>Delivery Period</td>
                        <td style={{ border: "1px solid black", padding: "5px" }}>
                          {pdfRecord.Delivery
                            ? ${pdfRecord.Delivery} days
                            : "Within 15 working days after advance"}
                        </td>
                      </tr>
                      <tr style={{ border: "1px solid black", padding: "5px" }}>
                        <td style={{ border: "1px solid black", padding: "5px" }}>Warranty</td>
                        <td style={{ border: "1px solid black", padding: "5px" }}>
                          {pdfRecord.Warranty
                            ? ${pdfRecord.Warranty} year(s)
                            : "1 year from the date of invoice"}
                        </td>
                      </tr>
                      <tr style={{ border: "1px solid black", padding: "5px" }}>
                        <td style={{ border: "1px solid black", padding: "5px" }}>Freight</td>
                        <td style={{ border: "1px solid black", padding: "5px" }}>
                          {pdfRecord.Freight || "Extra as per actual"}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ marginTop: 30, border: "1px solid #ccc", padding: "10px" }}>
                    <p>
                      We hope that you may satisfy with our prices and the specification. We expect
                      your valuable order in this regard.
                    </p>
                    <br />
                    <p>With Best Regards</p>
                    <br />
                    <p>For AcculerMedia</p>
                    <p style={{ display: "flex", justifyContent: "flex-end", marginTop: "-20px" }}>
                      Authorized Signatory
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>No record selected.</p>
          )}
        </Drawer>
      </div>
    </Spin>
  );
};

export default Quotation;
