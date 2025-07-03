import {
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Space,
  Radio,
  theme,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  PrinterOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";
import axios from "../../api/axios";
import { toast } from "react-hot-toast";

const { Option } = Select;
const { TextArea } = Input;
const { useToken } = theme;

const InvoiceForm = ({ onCancel, onSave, initialValues, isSaving }) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState([
    {
      id: 1,
      productId: null,
      description: "",
      hsnSac: "",
      quantity: 1,
      quantityType: "",
      rate: 0,
      specifications: [{ key: Date.now(), name: "", value: "" }],
    },
  ]);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [businessOptions, setBusinessOptions] = useState([]);
  const [taxRate, setTaxRate] = useState(); // Default GST rate to 18% for manual entry
  const [productOptions, setProductOptions] = useState([]);
  const [selectedBusinessDetails, setSelectedBusinessDetails] = useState(null);
  const [gstType, setGstType] = useState(null); // Added GST Type for Invoice

  const { token } = useToken();

  // Styles derived from QuotationFormStyles for consistency
  const styles = {
    mainCardTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: token.colorPrimary,
    },
    quotationCard: {
      borderRadius: token.borderRadiusLG,
      boxShadow: token.boxShadowSecondary,
    },
    formField: {
      width: "100%",
    },
    readOnlyFormField: {
      width: "100%",
      backgroundColor: token.colorFillAlter,
      color: token.colorTextDisabled,
      cursor: "not-allowed",
    },
    textAreaField: {
      width: "100%",
      resize: "vertical",
    },
    readOnlyTextArea: {
      width: "100%",
      backgroundColor: token.colorFillAlter,
      color: token.colorTextDisabled,
      cursor: "not-allowed",
      resize: "vertical",
    },
    businessInfoCard: {
      backgroundColor: token.colorFillAlter,
      borderColor: token.colorBorderSecondary,
      borderRadius: token.borderRadiusSM,
    },
    businessInfoPre: {
      whiteSpace: "pre-wrap",
      fontFamily: "Roboto, sans-serif",
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
      margin: 0,
    },
    divider: {
      margin: "24px 0",
      borderColor: token.colorBorderSecondary,
      borderStyle: "dashed",
    },
    itemCard: {
      marginBottom: token.margin,
      borderRadius: token.borderRadius,
      border: `1px solid ${token.colorBorder}`,
    },
    deleteButton: {
      color: token.colorError,
    },
    specificationDivider: {
      margin: "16px 0 8px 0",
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
    },
    specificationRow: {
      marginBottom: token.marginXS,
    },
    addButton: {
      width: "100%",
      borderColor: token.colorPrimaryBorder,
      color: token.colorPrimary,
    },
    addSpecButton: {
      marginTop: token.margin,
      borderColor: token.colorBorder,
      color: token.colorTextSecondary,
    },
    addItemButton: {
      marginTop: token.margin,
      borderColor: token.colorBorder,
      color: token.colorTextSecondary,
    },
    summaryRow: {
      marginBottom: token.margin,
    },
    totalField: {
      backgroundColor: token.colorFillAlter,
      color: token.colorText,
      fontWeight: "bold",
      fontSize: token.fontSizeLG,
    },
    grandTotalField: {
      backgroundColor: token.colorSuccessBg,
      color: token.colorSuccessText,
      fontWeight: "bold",
      fontSize: token.fontSizeXL,
    },
    notesCard: {
      backgroundColor: token.colorFillAlter,
      borderColor: token.colorBorderSecondary,
      borderRadius: token.borderRadiusSM,
    },
    noteText: {
      marginBottom: token.marginXS,
      color: token.colorTextSecondary,
    },
    buttonGroup: {
      marginTop: token.marginXL,
      textAlign: "right",
    },
  };

  const hasFetchedBusinessOptions = useRef(false);
  const hasFetchedProductOptions = useRef(false);

  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.email || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  const formatBusinessInfo = useCallback((business) => {
    if (!business) return "";
    return `
${business.businessName?.toUpperCase()}
${business.contactName ? `Mr. ${business.contactName?.toUpperCase()}` : ""}
${business.addressLine1 || ""}${
      business.addressLine2 ? ", " + business.addressLine2 : ""
    }
${business.city || ""}${business.pincode ? " - " + business.pincode : ""}
${business.state || ""}, ${business.country || ""}
${business.gstNumber || ""}
`.trim();
  }, []);

  const fetchBusinessOptions = useCallback(async () => {
    if (hasFetchedBusinessOptions.current) return;
    hasFetchedBusinessOptions.current = true;

    const toastId = toast.loading("Loading business options...");
    try {
      const res = await axios.get("/api/invoices/leads/active");
      setBusinessOptions(res.data);
      toast.success("Business options loaded", { id: toastId });
    } catch (error) {
      toast.error("Failed to load businesses", { id: toastId });
      console.error("Error fetching business options:", error);
      hasFetchedBusinessOptions.current = false;
    }
  }, []);

  const fetchInvoiceTypes = useCallback(async () => {
    const toastId = toast.loading("Loading invoice types...");
    try {
      const res = await axios.get("/api/invoices/types");
      setInvoiceTypes(res.data);
      toast.success("Invoice types loaded", { id: toastId });
    } catch (error) {
      toast.error("Failed to load invoice types", { id: toastId });
      console.error("Error fetching invoice types:", error);
    }
  }, []);

  const fetchProductOptions = useCallback(async () => {
    if (hasFetchedProductOptions.current) return;
    hasFetchedProductOptions.current = true;

    const toastId = toast.loading("Loading product options...");
    try {
      const res = await axios.get("/api/product");
      setProductOptions(
        res.data.map((p) => ({
          ...p,
          hsnSac: p.hsnSac || "",
          quantityType: p.quantityType || "",
          options: p.options || [],
        }))
      );
      toast.success("Product options loaded", { id: toastId });
    } catch (error) {
      toast.error("Failed to load products", { id: toastId });
      console.error("Error fetching product options:", error);
      hasFetchedProductOptions.current = false;
    }
  }, []);

  useEffect(() => {
    fetchBusinessOptions();
    fetchProductOptions();
    fetchInvoiceTypes();

    if (initialValues) {
      const selectedBusinessId =
        initialValues.businessId?._id || initialValues.businessId;
      const selectedBusiness = businessOptions.find(
        (b) => b._id === selectedBusinessId
      );

      form.setFieldsValue({
        ...initialValues,
        date: initialValues.date ? dayjs(initialValues.date) : null,
        dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : null,
        paymentStatus: initialValues.paymentStatus || "pending",
        invoiceType: initialValues.invoiceType || "Invoice",
        gstType: initialValues.gstType || null, // Set GST Type
        businessName: selectedBusiness?.businessName,
        businessType: selectedBusiness?.type,
        businessInfo: selectedBusiness
          ? formatBusinessInfo(selectedBusiness)
          : "", // Use formatBusinessInfo
        gstin: selectedBusiness?.gstNumber || "",
        businessId: selectedBusiness?._id,
      });

      setItems(initialValues.items || []);
      setPaymentStatus(initialValues.paymentStatus || "pending");
      setDueDate(initialValues.dueDate ? dayjs(initialValues.dueDate) : null);
      setGstType(initialValues.gstType || null); // Set GST Type state
      setTaxRate(initialValues.gstPercentage || 0);
      if (selectedBusiness) {
        setSelectedBusinessDetails(selectedBusiness);
      }
    }
  }, [
    initialValues,
    businessOptions,
    fetchBusinessOptions,
    fetchProductOptions,
    form,
    formatBusinessInfo,
    fetchInvoiceTypes,
  ]);

  const addItem = () => {
    const nextId = Math.max(0, ...items.map((i) => i.id)) + 1;
    setItems([
      ...items,
      {
        id: nextId,
        productId: null,
        description: "",
        hsnSac: "",
        quantity: 1,
        quantityType: "",
        rate: 0,
        specifications: [{ key: Date.now(), name: "", value: "" }],
      },
    ]);
  };

  const updateItem = (id, key, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          if (key === "productId") {
            const selectedProduct = productOptions.find((p) => p._id === value);
            if (selectedProduct) {
              return {
                ...item,
                productId: value,
                description: selectedProduct.description || "",
                hsnSac: selectedProduct.hsnSac || "",
                rate: selectedProduct.price || 0,
                quantityType: selectedProduct.quantityType || "",
                specifications:
                  selectedProduct.options && selectedProduct.options.length > 0
                    ? selectedProduct.options.map((opt) => ({
                        key: Date.now() + Math.random(),
                        name: opt.type || "",
                        value: opt.description || "",
                      }))
                    : [
                        {
                          key: Date.now() + Math.random(),
                          name: "",
                          value: "",
                        },
                      ],
              };
            }
          }
          return { ...item, [key]: value };
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const addSpecification = (itemId) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              specifications: [
                ...item.specifications,
                { key: Date.now() + Math.random(), name: "", value: "" },
              ],
            }
          : item
      )
    );
  };

  const removeSpecification = (itemId, specKey) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              specifications: item.specifications.filter(
                (spec) => spec.key !== specKey
              ),
            }
          : item
      )
    );
  };

  const updateSpecification = (itemId, specKey, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              specifications: item.specifications.map((spec) =>
                spec.key === specKey ? { ...spec, [field]: value } : spec
              ),
            }
          : item
      )
    );
  };

  const calculateSubTotal = () =>
    items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
      0
    );
  const calculateTotalGSTAmount = () => calculateSubTotal() * (taxRate / 100);

  const calculateIGST = () => {
    return gstType === "interstate" ? calculateTotalGSTAmount() : 0;
  };

  const calculateCGST = () => {
    return gstType === "intrastate" ? calculateTotalGSTAmount() / 2 : 0;
  };

  const calculateSGST = () => {
    return gstType === "intrastate" ? calculateTotalGSTAmount() / 2 : 0;
  };

  const calculateGrandTotal = () =>
    calculateSubTotal() + calculateTotalGSTAmount();

  const handleBusinessSelect = (id) => {
    const selected = businessOptions.find((b) => b._id === id);
    if (selected) {
      setSelectedBusinessDetails(selected);
      const fullInfo = formatBusinessInfo(selected);
      form.setFieldsValue({
        businessId: selected._id,
        businessName: selected.businessName,
        businessType: selected.type,
        gstin: selected.gstNumber,
        businessInfo: fullInfo,
      });
    } else {
      setSelectedBusinessDetails(null);
      form.setFieldsValue({
        businessId: null,
        businessName: null,
        businessType: null,
        gstin: null,
        businessInfo: "",
      });
    }
  };

  const onFinish = (values) => {
    if (!items || items.length === 0) {
      toast.error("At least one item is required.");
      return;
    }
    if (!gstType) {
      toast.error("Please select a GST type.");
      return;
    }

    const subTotal = calculateSubTotal();
    const gstPercentage = taxRate;
    const totalAmount = calculateGrandTotal(); // Use calculateGrandTotal for the final total

    const newPayment = {
      amount: values.newPaymentAmount,
      method: values.newPaymentMethod,
      reference: values.newPaymentReference,
      date: values.newPaymentDate?.format("YYYY-MM-DD"),
      addedBy: getCurrentUser(),
    };

    const invoiceData = {
      ...values,
      date: values.date?.format("YYYY-MM-DD"),
      dueDate: dueDate?.format("YYYY-MM-DD"),
      paymentStatus,
      items,
      subTotal,
      gstPercentage: gstPercentage,
      totalAmount, // This is the grand total
      gstType: gstType,
      igstAmount: calculateIGST(),
      cgstAmount: calculateCGST(),
      sgstAmount: calculateSGST(),
      businessName: selectedBusinessDetails?.businessName,
      businessType: selectedBusinessDetails?.type,
      gstin: selectedBusinessDetails?.gstNumber,
      businessInfo: selectedBusinessDetails
        ? formatBusinessInfo(selectedBusinessDetails)
        : "",
    };

    if (newPayment.amount && newPayment.method) {
      invoiceData.paymentHistory = [
        ...(initialValues?.paymentHistory || []),
        newPayment,
      ];
    }

    delete invoiceData.newPaymentAmount;
    delete invoiceData.newPaymentMethod;
    delete invoiceData.newPaymentReference;
    delete invoiceData.newPaymentDate;

    onSave(invoiceData);
  };

  return (
    <Card
      title={
        <span style={styles.mainCardTitle}>
          {initialValues ? "Edit Invoice" : "Create New Invoice"}
        </span>
      }
      loading={isSaving}
      style={styles.quotationCard}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={[16, 24]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Business Name"
              name="businessId"
              rules={[{ required: true, message: "Please select a business!" }]}
            >
              <Select
                placeholder="Select business"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={handleBusinessSelect}
                allowClear
                style={styles.formField}
              >
                {businessOptions.map((b) => (
                  <Option key={b._id} value={b._id}>
                    {b.businessName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="businessName" hidden>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="businessType" label="Type">
              <Input readOnly style={styles.readOnlyFormField} />
            </Form.Item>
          </Col>
        </Row>

  <Row gutter={[24]}>
  <Col xs={24} md={12}>
    <Form.Item label="Business Info">
      <Card bordered style={styles.businessInfoCard}>
        <pre style={styles.businessInfoPre}>
          {form.getFieldValue("businessInfo") ||
            "Select a business to view details..."}
        </pre>
      </Card>
    </Form.Item>
  </Col>
  
  <Col xs={24} md={12}>
    <Form.Item
      label="Invoice Type"
      name="invoiceType"
      rules={[{ required: true, message: 'Please select an invoice type' }]}
    >
      <Select
        placeholder="Select invoice type"
        style={styles.formField}
        allowClear
      >
        {invoiceTypes.map((type) => (
          <Option key={type} value={type}>
            {type}
          </Option>
        ))}
      </Select>
    </Form.Item>
  </Col>
</Row>
        <Row gutter={16}>
          {initialValues?.invoiceNumber && (
            <Col span={12}>
              <Form.Item label="Invoice Number">
                <Input
                  value={initialValues.invoiceNumber}
                  readOnly
                  style={styles.readOnlyFormField}
                />
              </Form.Item>
            </Col>
          )}
          <Col span={12}>
            <Form.Item label="GSTIN" name="gstin">
              <Input readOnly style={styles.readOnlyFormField} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Date" name="date" rules={[{ required: true }]}>
              <DatePicker style={styles.formField} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Due Date" name="dueDate">
              <DatePicker
                style={styles.formField}
                format="DD/MM/YYYY"
                value={dueDate}
                onChange={setDueDate}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Customer Name"
          name="customerName"
          rules={[{ required: true }]}
        >
          <Input style={styles.formField} />
        </Form.Item>
        <Form.Item
          label="Customer Address"
          name="customerAddress"
          rules={[{ required: true }]}
        >
          <TextArea rows={2} style={styles.textAreaField} />
        </Form.Item>

        <Form.Item label="Payment Status" name="paymentStatus">
          <Radio.Group
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <Radio.Button value="pending">Pending</Radio.Button>
            <Radio.Button value="partial">Partial</Radio.Button>
            <Radio.Button value="paid">Paid</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Divider style={styles.divider}>Invoice Items</Divider>
        {items.map((item, index) => {
          const isProductSelected = item.productId !== null;
          return (
            <Card key={item.id} style={styles.itemCard} size="small">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={8}>
                  <Form.Item label="Product" noStyle>
                    <Select
                      placeholder="Search or select a product"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children || "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={(value) =>
                        updateItem(item.id, "productId", value)
                      }
                      value={item.productId}
                      style={styles.formField}
                    >
                      {productOptions.map((p) => (
                        <Option key={p._id} value={p._id}>
                          {p.productName || p.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={12} sm={4}>
                  <Form.Item label="Qty" noStyle>
                    <InputNumber
                      placeholder="1"
                      value={item.quantity}
                      onChange={(val) => updateItem(item.id, "quantity", val)}
                      style={styles.formField}
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Item label="Unit Type" noStyle>
                    <Input
                      placeholder="e.g., Pcs, Kg, Mtr"
                      value={item.quantityType}
                      onChange={(e) =>
                        updateItem(item.id, "quantityType", e.target.value)
                      }
                      style={
                        isProductSelected
                          ? styles.readOnlyFormField
                          : styles.formField
                      }
                    />
                  </Form.Item>
                </Col>
                <Col
                  xs={24}
                  sm={6}
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  {items.length > 1 && (
                    <Tooltip title="Remove Item">
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => removeItem(item.id)}
                        type="text"
                        style={styles.deleteButton}
                      />
                    </Tooltip>
                  )}
                </Col>
              </Row>
              <Row gutter={[16, 16]} style={{ marginTop: token.marginS }}>
                <Col xs={24} sm={8}>
                  <Form.Item label="Price (per unit)" noStyle>
                    <Input
                      prefix="₹"
                      value={item.rate.toFixed(2)}
                      readOnly
                      style={styles.readOnlyFormField}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={16}>
                  <Form.Item label="Description" noStyle>
                    <TextArea
                      placeholder="Detailed description of the item"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      style={
                        isProductSelected
                          ? styles.textAreaField
                          : styles.textAreaField
                      }
                      rows={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} style={{ marginTop: token.marginS }}>
                <Col xs={24} sm={8}>
                  <Form.Item label="HSN/SAC Code" noStyle>
                    <Input
                      placeholder="HSN/SAC"
                      value={item.hsnSac}
                      onChange={(e) =>
                        updateItem(item.id, "hsnSac", e.target.value)
                      }
                      style={
                        isProductSelected
                          ? styles.readOnlyFormField
                          : styles.formField
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Item Total" noStyle>
                    <Input
                      value={`₹${(
                        (item.quantity || 0) * (item.rate || 0)
                      ).toFixed(2)}`}
                      readOnly
                      style={styles.totalField}
                    />
                  </Form.Item>
                </Col>
              </Row>
              {item.specifications && item.specifications.length > 0 && (
                <>
                  <Divider
                    orientation="left"
                    style={styles.specificationDivider}
                  >
                    Specifications
                  </Divider>
                  {item.specifications.map((spec, specIndex) => (
                    <Row
                      key={spec.key}
                      gutter={16}
                      style={styles.specificationRow}
                      align="middle"
                    >
                      <Col xs={24} sm={10}>
                        <Input
                          placeholder="Specification Name (e.g., Color)"
                          value={spec.name}
                          onChange={(e) =>
                            updateSpecification(
                              item.id,
                              spec.key,
                              "name",
                              e.target.value
                            )
                          }
                          style={styles.formField}
                        />
                      </Col>
                      <Col xs={24} sm={10}>
                        <Input
                          placeholder="Specification Value (e.g., Blue)"
                          value={spec.value}
                          onChange={(e) =>
                            updateSpecification(
                              item.id,
                              spec.key,
                              "value",
                              e.target.value
                            )
                          }
                          style={styles.formField}
                        />
                      </Col>
                      <Col xs={24} sm={4}>
                        <Space>
                          {item.specifications.length > 1 && (
                            <Tooltip title="Remove Specification">
                              <Button
                                icon={<MinusCircleOutlined />}
                                onClick={() =>
                                  removeSpecification(item.id, spec.key)
                                }
                                type="text"
                                danger
                                style={styles.deleteButton}
                              />
                            </Tooltip>
                          )}
                          {specIndex === item.specifications.length - 1 && (
                            <Tooltip title="Add New Specification">
                              <Button
                                icon={<PlusOutlined />}
                                onClick={() => addSpecification(item.id)}
                                type="dashed"
                                style={styles.addButton}
                              />
                            </Tooltip>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  ))}
                </>
              )}
              {(!item.specifications ||
                item.specifications.length === 0 ||
                (item.specifications.length > 0 &&
                  item.specifications[item.specifications.length - 1].name &&
                  item.specifications[item.specifications.length - 1]
                    .value)) && (
                <Button
                  onClick={() => addSpecification(item.id)}
                  block
                  type="dashed"
                  style={styles.addSpecButton}
                >
                  + Add Specification
                </Button>
              )}
            </Card>
          );
        })}
        <Button
          onClick={addItem}
          block
          type="dashed"
          style={styles.addItemButton}
        >
          + Add Another Item
        </Button>

        <Divider style={styles.divider}>Summary</Divider>
        <Col xs={24} md={12}>
          <Form.Item
            name="gstType"
            label="GST Type"
            rules={[{ required: true, message: "Please select a GST type!" }]}
          >
            <Select
              placeholder="Select GST calculation type"
              onChange={(value) => setGstType(value)}
              value={gstType}
              style={styles.formField}
            >
              <Option value="interstate">
                Interstate - IGST (Integrated GST)
              </Option>
              <Option value="intrastate">
                Intrastate - SGST/CGST (State/Central GST)
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Row gutter={[16, 16]} style={styles.summaryRow}>
          <Col xs={24} sm={8}>
            <Form.Item label="Sub Total">
              <Input
                readOnly
                value={`₹${calculateSubTotal().toFixed(2)}`}
                style={styles.totalField}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="GST Rate (%)">
              <InputNumber
                min={0}
                max={100}
                step={0.1}
                value={taxRate}
                onChange={setTaxRate}
                style={styles.formField}
              />
            </Form.Item>
          </Col>
          {gstType === "interstate" && (
            <Col xs={24} sm={8}>
              <Form.Item label="IGST Amount">
                <Input
                  readOnly
                  value={`₹${calculateIGST().toFixed(2)}`}
                  style={styles.totalField}
                />
              </Form.Item>
            </Col>
          )}
          {gstType === "intrastate" && (
            <>
              <Col xs={24} sm={8}>
                <Form.Item label="CGST Amount">
                  <Input
                    readOnly
                    value={`₹${calculateCGST().toFixed(2)}`}
                    style={styles.totalField}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="SGST Amount">
                  <Input
                    readOnly
                    value={`₹${calculateSGST().toFixed(2)}`}
                    style={styles.totalField}
                  />
                </Form.Item>
              </Col>
            </>
          )}
          <Col xs={24} sm={8}>
            <Form.Item label="Grand Total">
              <Input
                readOnly
                value={`₹${calculateGrandTotal().toFixed(2)}`}
                style={styles.grandTotalField}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Payment History</Divider>
        {initialValues?.paymentHistory?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {initialValues.paymentHistory.map((p, i) => (
              <Card key={i} size="small" style={{ marginBottom: 8 }}>
                <p>
                  <strong>Amount:</strong> ₹{p.amount}
                </p>
                <p>
                  <strong>Method:</strong> {p.method}
                </p>
                <p>
                  <strong>Date:</strong> {p.date}
                </p>
                <p>
                  <strong>Reference:</strong> {p.reference}
                </p>
                <p>
                  <strong>Added By:</strong> {p.addedBy}
                </p>
              </Card>
            ))}
          </div>
        )}

        <Divider>Add Payment Entry</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Amount" name="newPaymentAmount">
              <InputNumber min={0} style={styles.formField} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Method" name="newPaymentMethod">
              <Select placeholder="Select method" style={styles.formField}>
                <Option value="Cash">Cash</Option>
                <Option value="Bank">Bank</Option>
                <Option value="UPI">UPI</Option>
                <Option value="Cheque">Cheque</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Reference" name="newPaymentReference">
              <Input style={styles.formField} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Date" name="newPaymentDate">
              <DatePicker style={styles.formField} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={styles.buttonGroup}>
          <Space size="middle">
            <Button onClick={onCancel} size="large" disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              loading={isSaving}
            >
              {initialValues ? "Update Invoice" : "Save Invoice"}
            </Button>
            <Button
              icon={<PrinterOutlined />}
              size="large"
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default InvoiceForm;
