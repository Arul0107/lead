import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import {
  Card, Input, Button, Table, Tabs, Typography, Empty, Tag, Switch, Modal,
  Dropdown, // NEW IMPORT
  Menu,     // NEW IMPORT
} from 'antd';
import {
  SearchOutlined, EditOutlined, MessageOutlined, EyeOutlined,
  PrinterOutlined, // Added for PDF generation if needed, though not directly used in existing actions
  CustomerServiceOutlined, DeleteOutlined,
  MoreOutlined, // NEW IMPORT for the 3-dot icon
} from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import BusinessAccountForm from './BusinessAccountForm';
import NotesDrawer from './NotesDrawer';
import FollowUpDrawer from './FollowUpDrawer';
import jsPDF from 'jspdf'; // Import jsPDF for PDF generation
import html2canvas from 'html2canvas'; // Import html2canvas for PDF generation

const { Title } = Typography;
const { TabPane } = Tabs;

const Customers = () => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [accountToUpdate, setAccountToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const [notesDrawerVisible, setNotesDrawerVisible] = useState(false);
  const [followUpDrawerVisible, setFollowUpDrawerVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const navigate = useNavigate();

  const fetchCustomers = () => {
    setLoading(true);
    axios
      .get('/api/accounts/customers')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setCustomers(data);
        toast.success('Customers loaded');
      })
      .catch(() => {
        toast.error('Failed to load customers');
        setCustomers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (record) => {
    setCurrentCustomer(record);
    setFormVisible(true);
  };

  const handleSave = (values) => {
    setLoading(true);
    const request = currentCustomer?._id
      ? axios.put(`/api/accounts/${currentCustomer._id}`, values)
      : axios.post('/api/accounts', values);

    request
      .then(() => {
        toast.success(`Customer ${currentCustomer?._id ? 'updated' : 'created'} successfully`);
        fetchCustomers();
      })
      .catch(() => {
        toast.error(`Failed to ${currentCustomer?._id ? 'update' : 'create'} customer`);
      })
      .finally(() => {
        setFormVisible(false);
        setCurrentCustomer(null);
        setLoading(false);
      });
  };

  const handleStatusChange = (checked, record) => {
    setAccountToUpdate(record);
    setNewStatus(checked ? 'Active' : 'Inactive');
    setIsModalVisible(true);
  };

  const confirmStatusChange = () => {
    setLoading(true);
    const updated = { ...accountToUpdate, status: newStatus };
    axios
      .put(`/api/accounts/${accountToUpdate._id}`, updated)
      .then(() => {
        toast.success('Status updated');
        fetchCustomers();
      })
      .catch(() => {
        toast.error('Failed to update status');
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoading(false);
      });
  };

  const handleDelete = (record) => {
    setCustomerToDelete(record);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (!customerToDelete?._id) return;
    setLoading(true);
    axios
      .delete(`/api/accounts/${customerToDelete._id}`)
      .then(() => {
        toast.success('Customer deleted successfully');
        fetchCustomers();
      })
      .catch(() => {
        toast.error('Failed to delete customer');
      })
      .finally(() => {
        setDeleteModalVisible(false);
        setCustomerToDelete(null);
        setLoading(false);
      });
  };

  const handleOpenNotesDrawer = (account) => {
    setSelectedAccount(account);
    setNotesDrawerVisible(true);
  };

  const handleOpenFollowUpDrawer = (account) => {
    setSelectedAccount(account);
    setFollowUpDrawerVisible(true);
  };

  const goToCustomerProfile = (record) => {
    navigate(`/customers/${record._id}`);
  };

  const generatePdf = async (account) => {
    const input = document.getElementById(`customer-pdf-content-${account._id}`);
    if (!input) {
      toast.error('PDF content not found. Please ensure the customer details are rendered when generating PDF.');
      return;
    }

    toast.loading('Generating PDF...', { id: 'pdf-toast' });

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${account.businessName}-details.pdf`);
      toast.success('PDF generated!', { id: 'pdf-toast' });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error('Failed to generate PDF.', { id: 'pdf-toast' });
    }
  };


  const filtered = customers.filter((account) => {
    const search = searchText.toLowerCase();
    return (
      account.businessName?.toLowerCase().includes(search) ||
      account.contactName?.toLowerCase().includes(search) ||
      account.email?.toLowerCase().includes(search)
    );
  });

  const active = filtered.filter((a) => a.status === 'Active');
  const inactive = filtered.filter((a) => a.status === 'Inactive');

  const typeTag = (type) => {
    switch (type) {
      case 'Hot':
        return <Tag color="red">Hot</Tag>;
      case 'Warm':
        return <Tag color="orange">Warm</Tag>;
      case 'Cold':
        return <Tag color="blue">Cold</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const columns = [
    { title: 'Sno.', render: (_, __, i) => i + 1, width: 60 },
    { title: 'Business Name', dataIndex: 'businessName' },
    { title: 'Contact Name', dataIndex: 'contactName', responsive: ['md', 'lg'] },
    { title: 'Email Id', dataIndex: 'email', responsive: ['lg'] },
    { title: 'Type', dataIndex: 'type', render: typeTag, responsive: ['md', 'lg'] },
    {
      title: 'Latest Note',
      render: (_, record) => {
        const note = record.notes?.[record.notes.length - 1];
        return note ? (
          <div>
            <small style={{ color: '#888' }}>{note.timestamp}</small><br />
            {note.text}
          </div>
        ) : <em>No notes</em>;
      },
      responsive: ['lg']
    },
    {
      title: 'Status',
      render: (_, record) => (
        <Tag color={record.status === 'Active' ? 'green' : 'red'}>
          {record.status}
        </Tag>
      ),
      responsive: ['sm', 'md', 'lg']
    },
    {
      title: 'Actions',
      width: 80, // Adjusted width for dropdown
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                Edit Customer
              </Menu.Item>
              <Menu.Item key="notes" icon={<MessageOutlined />} onClick={() => handleOpenNotesDrawer(record)}>
                View/Add Notes
              </Menu.Item>
              <Menu.Item key="followups" icon={<CustomerServiceOutlined />} onClick={() => handleOpenFollowUpDrawer(record)}>
                View/Add Follow-ups
              </Menu.Item>
              <Menu.Item key="view-profile" icon={<EyeOutlined />} onClick={() => goToCustomerProfile(record)}>
                View Profile
              </Menu.Item>
              <Menu.Item key="generate-pdf" icon={<PrinterOutlined />} onClick={() => generatePdf(record)}>
                Generate PDF
              </Menu.Item>
              {/* Conditional menu item for changing status */}
              {record.status === 'Active' ? (
                <Menu.Item
                  key="change-to-inactive"
                  onClick={() => handleStatusChange(false, record)}
                >
                  Change to Inactive
                </Menu.Item>
              ) : (
                <Menu.Item
                  key="change-to-active"
                  onClick={() => handleStatusChange(true, record)}
                >
                  Change to Active
                </Menu.Item>
              )}
              {/* Delete action using Modal.confirm */}
              <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDelete(record)} // handleDelete will show the Modal.confirm
              >
                Delete Customer
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: '10px' }}>
          <Title level={4}>Customers</Title>
          <Input
            placeholder="Search by Business Name, Contact Name or Email"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '100%', maxWidth: 400 }} // Make search input responsive
          />
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Active (${active.length})`} key="active">
            <Table
              columns={columns}
              dataSource={active}
              rowKey="_id"
              pagination={{ pageSize: 10 }} // Added pagination
              loading={loading}
              locale={{ emptyText: <Empty description="No active customers" /> }}
              scroll={{ x: 'max-content' }} // Ensure horizontal scrollability
            />
          </TabPane>
          <TabPane tab={`Inactive (${inactive.length})`} key="inactive">
            <Table
              columns={columns}
              dataSource={inactive}
              rowKey="_id"
              pagination={{ pageSize: 10 }} // Added pagination
              loading={loading}
              locale={{ emptyText: <Empty description="No inactive customers" /> }}
              scroll={{ x: 'max-content' }} // Ensure horizontal scrollability
            />
          </TabPane>
        </Tabs>
      </Card>

      <BusinessAccountForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
        initialValues={currentCustomer}
      />

      <Modal
        title="Confirm Status Change"
        open={isModalVisible} // Use 'open' instead of 'visible'
        onOk={confirmStatusChange}
        onCancel={() => setIsModalVisible(false)}
        okText="Yes"
        cancelText="No"
        confirmLoading={loading}
      >
        <p>
          Are you sure you want to change the status of <strong>{accountToUpdate?.businessName}</strong> to <strong>{newStatus}</strong>?
        </p>
      </Modal>

      <Modal
        title="Confirm Delete"
        open={deleteModalVisible} // Use 'open' instead of 'visible'
        onOk={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        confirmLoading={loading}
      >
        <p>
          Are you sure you want to delete <strong>{customerToDelete?.businessName}</strong>?
        </p>
      </Modal>

      {selectedAccount && (
        <FollowUpDrawer
          visible={followUpDrawerVisible}
          onClose={() => setFollowUpDrawerVisible(false)}
          account={selectedAccount}
          refreshAccounts={fetchCustomers}
        />
      )}

      {selectedAccount && (
        <NotesDrawer
          visible={notesDrawerVisible}
          onClose={() => setNotesDrawerVisible(false)}
          account={selectedAccount}
          refreshAccounts={fetchCustomers}
        />
      )}
    </div>
  );
};

export default Customers;
