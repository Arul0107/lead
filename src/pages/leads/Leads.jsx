import React, { useState, useEffect, useRef } from "react";
import axios from "../../api/axios";
import {
  Card,
  Input,
  Button,
  Table,
  Tabs,
  Switch,
  Typography,
  Empty,
  Modal,
  Tag,
  Popconfirm,
  Space,
  Dropdown,
  Menu,
  Spin // Added Spin for user loading
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  MessageOutlined,
  PrinterOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  MoreOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import BusinessAccountForm from "./BusinessAccountForm";
import NotesDrawer from "./NotesDrawer";
import FollowUpDrawer from "./FollowUpDrawer";

const { Title } = Typography;
const { TabPane } = Tabs;
const API_URL = "/api/accounts"; // Assuming your business account API base path

const Leads = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [accountToUpdate, setAccountToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [notesDrawerVisible, setNotesDrawerVisible] = useState(false);
  const [followUpDrawerVisible, setFollowUpDrawerVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // State variables for counts
  const [activeLeadsCount, setActiveLeadsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [waitingLeadsCount, setWaitingLeadsCount] = useState(0);
  const [closedAccountsCount, setClosedAccountsCount] = useState(0);

  // NEW: State for users to assign to
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Ref for the table element to capture for PDF/Excel export
  const tableRef = useRef(null);

  // NEW: Fetch accounts and users on component mount or tab change
  useEffect(() => {
    fetchAccounts();
    fetchUsers(); // Fetch users when the component mounts
  }, [activeTab]);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}`);
      const allAccounts = response.data;

      const activeLeadsData = allAccounts.filter(
        (account) => account.status === "Active" && !account.isCustomer
      );
      const customersData = allAccounts.filter((account) => account.isCustomer);
      const waitingLeadsData = allAccounts.filter(
        (account) => account.status === "Waiting" && !account.isCustomer
      );
      const closedAccountsData = allAccounts.filter(
        (account) => account.status === "Closed"
      );

      setActiveLeadsCount(activeLeadsData.length);
      setCustomersCount(customersData.length);
      setWaitingLeadsCount(waitingLeadsData.length);
      setClosedAccountsCount(closedAccountsData.length);

      if (activeTab === "active") {
        setAccounts(activeLeadsData);
      } else if (activeTab === "customers") {
        setAccounts(customersData);
      } else if (activeTab === "waiting") {
        setAccounts(waitingLeadsData);
      } else if (activeTab === "closed") {
        setAccounts(closedAccountsData);
      } else {
        setAccounts(allAccounts);
      }
    } catch (error) {
      toast.error("Failed to fetch accounts.");
      console.error("Fetch accounts error:", error);
    }
  };

  // NEW: Function to fetch all users
const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Now fetching all users from the base /api/users endpoint
      const response = await axios.get('/api/users'); 
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users for assignment.');
    } finally {
      setLoadingUsers(false);
    }
  };
  const handleSaveAccount = async (values) => {
    try {
      if (currentAccount) {
        // When updating, if assignedTo is null, send it as null
        // Otherwise, send the _id from the selected user
        const dataToSend = {
          ...values,
          assignedTo: values.assignedTo === null ? null : values.assignedTo
        };
        await axios.put(`${API_URL}/${currentAccount._id}`, dataToSend);
        toast.success("Account updated successfully!");
      } else {
        // When creating, if assignedTo is null, send it as null
        const dataToSend = {
          ...values,
          assignedTo: values.assignedTo === null ? null : values.assignedTo
        };
        await axios.post(API_URL, dataToSend);
        toast.success("Account created successfully!");
      }
      setFormVisible(false);
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to save account.");
      console.error(
        "Save account error:",
        error.response?.data || error.message
      );
    }
  };

  const showEditForm = (account) => {
    setCurrentAccount(account);
    setFormVisible(true);
  };

  const handleDeleteAccount = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Account deleted successfully (soft delete)!");
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to delete account.");
      console.error(
        "Delete account error:",
        error.response?.data || error.message
      );
    }
  };

  const showNotesDrawer = (account) => {
    setSelectedAccount(account);
    setNotesDrawerVisible(true);
  };

  const showFollowUpDrawer = (account) => {
    setSelectedAccount(account);
    setFollowUpDrawerVisible(true);
  };

  const handleStatusChange = (checked, account) => {
    setAccountToUpdate(account);
    setNewStatus(checked);
    setIsModalVisible(true);
  };

  const handleConfirmStatusChange = async () => {
    try {
      const updatedAccount = { ...accountToUpdate, isCustomer: newStatus };
      await axios.put(`${API_URL}/${accountToUpdate._id}`, updatedAccount);
      toast.success(
        `Account status changed to ${newStatus ? "Customer" : "Lead"}!`
      );
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to update account status.");
      console.error(
        "Status update error:",
        error.response?.data || error.message
      );
    } finally {
      setIsModalVisible(false);
      setAccountToUpdate(null);
      setNewStatus(null);
    }
  };

  const handleCancelStatusChange = () => {
    setIsModalVisible(false);
    setAccountToUpdate(null);
    setNewStatus(null);
  };

  const exportTableToPdf = async () => {
    const input = tableRef.current;
    if (!input) {
      toast.error("Table content not found for PDF export.");
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-toast" });

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Leads_Customers_Data.pdf`);
      toast.success("PDF generated!", { id: "pdf-toast" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF.", { id: "pdf-toast" });
    }
  };

  const exportTableToExcel = () => {
    if (filteredAccounts.length === 0) {
      toast.error("No data to export to Excel.");
      return;
    }

    const dataForExcel = filteredAccounts.map((account, index) => {
      const row = {
        "S.No": index + 1,
        "Business Name": account.businessName,
        "Contact Name": account.contactName,
        Email: account.email,
        "Mobile Number": account.mobileNumber,
        "Lead Type": account.type,
        Status: account.status,
        "Source Type": account.sourceType,
        "Assigned To": account.assignedTo?.name || "Unassigned", // NEW: Include assignedTo name
        "GST Number": account.gstNumber,
        "Phone Number": account.phoneNumber,
        "Address Line 1": account.addressLine1,
        "Address Line 2": account.addressLine2,
        "Address Line 3": account.addressLine3,
        Landmark: account.landmark,
        City: account.city,
        Pincode: account.pincode,
        State: account.state,
        Country: account.country,
        Website: account.website,
        "Is Customer": account.isCustomer ? "Yes" : "No",
        "Created At": new Date(account.createdAt).toLocaleString(),
      };
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads & Customers");
    XLSX.writeFile(workbook, "Leads_Customers_Data.xlsx");
    toast.success("Data exported to Excel!");
  };

  const columns = [
    {
      title: "S.No",
      key: "sno",
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: "Business Name",
      dataIndex: "businessName",
      key: "businessName",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Business Name"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
      ),
      onFilter: (value, record) =>
        record.businessName.toLowerCase().includes(value.toLowerCase()),
      responsive: ["xs", "sm", "md", "lg"],
    },
    {
      title: "Contact Name",
      dataIndex: "contactName",
      key: "contactName",
      responsive: ["md", "lg"],
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      responsive: ["lg"],
    },
    {
      title: "Mobile Number",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
      responsive: ["md", "lg"],
    },
    {
      title: "Lead Type",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "Hot", value: "Hot" },
        { text: "Warm", value: "Warm" },
        { text: "Cold", value: "Cold" },
      ],
      onFilter: (value, record) => record.type.indexOf(value) === 0,
      responsive: ["md", "lg"],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color;
        switch (status) {
          case "Active":
            color = "green";
            break;
          case "Inactive":
            color = "red";
            break;
          case "Waiting":
            color = "orange";
            break;
          case "Closed":
            color = "purple";
            break;
          default:
            color = "blue";
        }
        return <Tag color={color}>{status}</Tag>;
      },
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
        { text: "Waiting", value: "Waiting" },
        { text: "Closed", value: "Closed" },
      ],
      onFilter: (value, record) => record.status.indexOf(value) === 0,
      responsive: ["sm", "md", "lg"],
    },
    {
      // NEW COLUMN: Assigned To
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo) => (assignedTo ? assignedTo.name : "Unassigned"),
      responsive: ["md", "lg"],
    },
    {
      title: "Source Type",
      dataIndex: "sourceType",
      key: "sourceType",
      filters: [
        { text: "Direct", value: "Direct" },
        { text: "Facebook Referral", value: "Facebook Referral " },
        { text: "Google Ads", value: "Google Ads" },
        { text: "Website", value: "Website" },
        { text: "Cold Call", value: "Cold Call" },
        { text: "Other", value: "Other" },
      ],
      onFilter: (value, record) => record.sourceType?.indexOf(value) === 0,
      responsive: ["lg"],
    },

    {
      title: "Action",
      key: "action",
      width: 80,
      render: (text, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => showEditForm(record)}
              >
                Edit Account
              </Menu.Item>
              <Menu.Item
                key="notes"
                icon={<MessageOutlined />}
                onClick={() => showNotesDrawer(record)}
              >
                View/Add Notes
              </Menu.Item>
              <Menu.Item
                key="followup"
                icon={<CustomerServiceOutlined />}
                onClick={() => showFollowUpDrawer(record)}
              >
                View/Add Follow-ups
              </Menu.Item>
              <Menu.Item
                key="generate-pdf-single"
                icon={<PrinterOutlined />}
                onClick={() => generatePdfSingleAccount(record)}
              >
                Generate PDF (Single)
              </Menu.Item>
              {/* Conditional menu item for changing status */}
              {record.isCustomer ? (
                <Menu.Item
                  key="change-to-lead"
                  onClick={() => handleStatusChange(false, record)}
                >
                  Change to Lead
                </Menu.Item>
              ) : (
                <Menu.Item
                  key="change-to-customer"
                  onClick={() => handleStatusChange(true, record)}
                >
                  Change to Customer
                </Menu.Item>
              )}
              {/* Delete action using Modal.confirm for consistency */}
              <Menu.Item>
                <Popconfirm
                  title="Are you sure you want to delete this account?"
                  onConfirm={() => handleDeleteAccount(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined /> 
                  Delete Account
                </Popconfirm>
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const generatePdfSingleAccount = async (account) => {
    const input = document.getElementById(`lead-${account._id}`);
    if (!input) {
      toast.error("PDF content not found for this account.");
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-toast" });

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${account.businessName}-details.pdf`);
      toast.success("PDF generated!", { id: "pdf-toast" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF.", { id: "pdf-toast" });
    }
  };

  const filteredAccounts = accounts.filter(
    (account) =>
      account.businessName.toLowerCase().includes(searchText.toLowerCase()) ||
      account.contactName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Card title={<Title level={2}>Manage Leads & Customers</Title>}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <Input
          placeholder="Search by business or contact name"
          prefix={<SearchOutlined />}
          style={{ width: "100%", maxWidth: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentAccount(null);
              setFormVisible(true);
            }}
          >
            Add New Account
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={exportTableToPdf}>
            Export to PDF
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={exportTableToExcel}>
            Export to Excel
          </Button>
        </Space>
      </div>

      <Tabs defaultActiveKey="active" onChange={setActiveTab}>
        <TabPane tab={`Active Leads (${activeLeadsCount})`} key="active" />
        <TabPane tab={`Customers (${customersCount})`} key="customers" />
        <TabPane tab={`Waiting Leads (${waitingLeadsCount})`} key="waiting" />
        <TabPane
          tab={`Closed Accounts (${closedAccountsCount})`}
          key="closed"
        />
      </Tabs>

      <div ref={tableRef}>
        {filteredAccounts.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredAccounts}
            rowKey="_id"
            scroll={{ x: "max-content" }}
          />
        ) : (
          <Empty description="No accounts found." />
        )}
      </div>

      <BusinessAccountForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSave={handleSaveAccount}
        initialValues={currentAccount}
        allUsers={users} // Pass the fetched users
        loadingUsers={loadingUsers} // Pass the loading state of users
      />

      {selectedAccount && (
        <>
          <NotesDrawer
            visible={notesDrawerVisible}
            onClose={() => setNotesDrawerVisible(false)}
            account={selectedAccount}
            refreshAccounts={fetchAccounts}
          />
          <FollowUpDrawer
            visible={followUpDrawerVisible}
            onClose={() => setFollowUpDrawerVisible(false)}
            account={selectedAccount}
            refreshAccounts={fetchAccounts}
          />
        </>
      )}

      <Modal
        title="Change Account Status"
        open={isModalVisible}
        onOk={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
        okText="Yes"
        cancelText="No"
      >
        <p>
          Are you sure you want to change this account's status to{" "}
          {newStatus ? "Customer" : "Lead"}?
        </p>
      </Modal>
    </Card>
  );
};

export default Leads;