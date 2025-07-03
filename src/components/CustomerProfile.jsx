import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs, List, Typography, Spin, Card, Descriptions, Breadcrumb, Button,
  Empty, Table, Collapse, Tag
} from 'antd';
import { ArrowLeftOutlined, FallOutlined, FormOutlined, DollarOutlined, SolutionOutlined, BookOutlined } from '@ant-design/icons';
import axios from 'axios'; // Corrected: Importing axios directly

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Panel } = Collapse;

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State for holding customer data and related records
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [payments, setPayments] = useState([]);

  // Effect to fetch all customer-related data on component mount or ID change
  useEffect(() => {
    setLoading(true);
    // Use Promise.all to fetch data concurrently for efficiency
    Promise.all([
      axios.get(`/api/accounts/${id}`), // Fetch customer details
      axios.get(`/api/quotations/business/${id}`), // Fetch quotations related to the business
      axios.get(`/api/invoices/business/${id}`), // Fetch invoices related to the business
      axios.get(`/api/accounts/${id}/followups`), // Fetch follow-ups for the customer
      axios.get(`/api/invoices/business/${id}/payments`) // Fetch payments for invoices related to the business
    ])
      .then(([cust, q, i, f, p]) => {
        setCustomer(cust.data);
        setQuotations(q.data || []); // Ensure array if data is null/undefined
        setInvoices(i.data || []);
        setFollowups(f.data || []);
        setPayments(p.data || []);
      })
      .catch((err) => {
        console.error('Failed to load data:', err);
        // Optionally, show a notification to the user
        // notification.error({ message: 'Error', description: 'Failed to load customer data.' });
      })
      .finally(() => setLoading(false)); // Set loading to false once all promises settle
  }, [id]); // Rerun effect if customer ID changes

  // Display a loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Loading Customer Profile..." />
      </div>
    );
  }

  // Display 'Customer Not Found' if no customer data is returned
  if (!customer) {
    return (
      <div className="p-6 bg-white shadow-lg rounded-lg m-6">
        <Button
          className="mb-4"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/customers')}
        >
          Back to Customers
        </Button>
        <Title level={3} className="mt-4 text-center text-gray-700">Customer Not Found</Title>
        <Empty
          description="No data found for this customer ID. It might not exist or there was an issue fetching it."
          className="mt-8"
        />
      </div>
    );
  }

  // Sort follow-ups and notes by date in descending order
  const sortedFollowups = [...followups].sort(
    (a, b) => new Date(b.followupDate || b.date) - new Date(a.followupDate || a.date)
  );

  const sortedNotes = [...(customer.notes || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString; // Return original if parsing fails
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Breadcrumb navigation */}
      <Breadcrumb
        className="mb-4"
        items={[
          { title: 'Customers', href: '/customers' },
          { title: customer.businessName || 'Profile' },
        ]}
      />

      {/* Header with back button and title */}
      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Title level={2} className="text-gray-800 font-semibold mb-0">
          {customer.businessName} Profile
        </Title>
      </div>

      {/* Customer Information Panel */}
      <Card
        title={<Title level={4} className="text-gray-700 mb-0">Customer Details</Title>}
        className="shadow-lg rounded-lg mb-6 border-t-4 border-blue-500"
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 2, lg: 3 }} size="middle" className="text-gray-700">
          <Descriptions.Item label="Business Name">
            <Text strong>{customer.businessName || 'N/A'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="GSTIN">{customer.gstNumber || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Customer Name">{customer.contactName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Email">{customer.email || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Phone Number">{customer.phoneNumber || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={customer.status === 'Active' ? 'green' : 'red'}>{customer.status || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Type">{customer.type || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Customer Address" span={3}>
            {Array.isArray(customer.addressLines) && customer.addressLines.length > 0
              ? customer.addressLines.join(', ')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {customer.updatedAt ? new Date(customer.updatedAt).toLocaleString() : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tabs for related data */}
      <Tabs defaultActiveKey="1" className="bg-white p-4 rounded-lg shadow-lg">
        {/* Quotations Tab */}
        <TabPane
          tab={
            <span className="flex items-center space-x-1">
              <FallOutlined />
              <span>Quotations ({quotations.length})</span>
            </span>
          }
          key="1"
        >
          {quotations.length === 0 ? (
            <Empty description="No quotations found for this customer." className="py-8" />
          ) : (
            <Collapse accordion className="shadow-sm">
              {quotations.map((q, idx) => (
                <Panel
                  header={
                    <div className="font-semibold text-lg flex justify-between items-center">
                      <span>Quotation #{q.quotationNumber}</span>
                      <span className="text-green-600">{formatCurrency(q.totalAmount)}</span>
                    </div>
                  }
                  key={q._id || idx} // Use _id as key if available, fallback to index
                  className="bg-gray-50 border-b border-gray-200"
                >
                  <Descriptions bordered column={2} size="small" className="mb-4">
                    <Descriptions.Item label="Date">{formatDate(q.date)}</Descriptions.Item>
                    <Descriptions.Item label="Status"><Tag color={q.status === 'Approved' ? 'green' : 'orange'}>{q.status || 'N/A'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Customer Name">{q.contactName || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="GSTIN">{q.gstNumber || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Customer Address" span={2}>
                      {Array.isArray(q.customerAddress) && q.customerAddress.length > 0
                        ? q.customerAddress.join(', ')
                        : 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>

                  <Title level={5} className="mt-4 mb-2 text-gray-700">Items Quoted</Title>
                  <Table
                    dataSource={q.items || []}
                    columns={[
                      { title: 'Description', dataIndex: 'description', key: 'description' },
                      { title: 'HSN/SAC', dataIndex: 'hsn', key: 'hsn' },
                      { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                      {
                        title: 'Rate (₹)',
                        dataIndex: 'rate',
                        key: 'rate',
                        render: val => formatCurrency(val)
                      },
                      {
                        title: 'Amount (₹)',
                        dataIndex: 'amount',
                        key: 'amount',
                        render: val => formatCurrency(val)
                      }
                    ]}
                    pagination={false}
                    rowKey={(_, i) => i}
                    size="small"
                    className="border rounded-md"
                  />
                </Panel>
              ))}
            </Collapse>
          )}
        </TabPane>

        {/* Invoices Tab */}
        <TabPane
          tab={
            <span className="flex items-center space-x-1">
              <SolutionOutlined />
              <span>Invoices ({invoices.length})</span>
            </span>
          }
          key="2"
        >
          {invoices.length === 0 ? (
            <Empty description="No invoices found for this customer." className="py-8" />
          ) : (
            <Collapse accordion className="shadow-sm">
              {invoices.map((inv, idx) => (
                <Panel
                  header={
                    <div className="font-semibold text-lg flex justify-between items-center">
                      <span>Invoice #{inv.invoiceNumber}</span>
                      <span className="text-green-600">{formatCurrency(inv.totalAmount)}</span>
                    </div>
                  }
                  key={inv._id || idx}
                  className="bg-gray-50 border-b border-gray-200"
                >
                  <Descriptions bordered size="small" column={2} className="mb-4">
                    <Descriptions.Item label="Date">{formatDate(inv.date)}</Descriptions.Item>
                    <Descriptions.Item label="Due Date">{formatDate(inv.dueDate)}</Descriptions.Item>
                    <Descriptions.Item label="Status"><Tag color={inv.status === 'Paid' ? 'green' : inv.status === 'Pending' ? 'orange' : 'red'}>{inv.status || 'N/A'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Customer Name">{inv.contactName || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="GSTIN">{inv.gstNumber || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Customer Address" span={2}>
                      {Array.isArray(inv.customerAddress) && inv.customerAddress.length > 0
                        ? inv.customerAddress.join(', ')
                        : 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>

                  <Title level={5} className="mt-4 mb-2 text-gray-700">Items Invoiced</Title>
                  <Table
                    dataSource={inv.items || []}
                    columns={[
                      { title: 'Description', dataIndex: 'description', key: 'description' },
                      { title: 'HSN/SAC', dataIndex: 'hsn', key: 'hsn' },
                      { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                      {
                        title: 'Rate (₹)',
                        dataIndex: 'rate',
                        key: 'rate',
                        render: val => formatCurrency(val)
                      },
                      {
                        title: 'Amount (₹)',
                        dataIndex: 'amount',
                        key: 'amount',
                        render: val => formatCurrency(val)
                      }
                    ]}
                    pagination={false}
                    rowKey={(_, i) => i}
                    size="small"
                    className="border rounded-md"
                  />
                </Panel>
              ))}
            </Collapse>
          )}
        </TabPane>

        {/* Follow-ups Tab */}
        <TabPane
          tab={
            <span className="flex items-center space-x-1">
              <FormOutlined />
              <span>Follow-ups ({sortedFollowups.length})</span>
            </span>
          }
          key="3"
        >
          {sortedFollowups.length === 0 ? (
            <Empty description="No follow-ups found for this customer." className="py-8" />
          ) : (
            <List
              bordered
              dataSource={sortedFollowups}
              className="rounded-lg overflow-hidden"
              renderItem={(item) => (
                <List.Item className="flex flex-col items-start bg-white p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-full">
                    <div className="font-semibold text-gray-700 text-base mb-1">
                      <span className="mr-2 text-blue-500"><BookOutlined /></span>
                      <Text strong>Date:</Text> {formatDate(item.followupDate || item.date)}
                    </div>
                    <div className="text-gray-800 mb-1 leading-relaxed">
                      <Text strong>Note:</Text> {item.note || item.comment || 'No comment provided'}
                    </div>
                    {item.addedBy && (
                      <div className="text-sm text-gray-500 mt-2">
                        Added by: <Text italic>{item.addedBy.name || item.addedBy.email || 'Unknown'}</Text>
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </TabPane>

        {/* Payments Tab */}
        <TabPane
          tab={
            <span className="flex items-center space-x-1">
              <DollarOutlined />
              <span>Payments ({payments.length})</span>
            </span>
          }
          key="4"
        >
          {payments.length === 0 ? (
            <Empty description="No payments found for this customer." className="py-8" />
          ) : (
            <List
              bordered
              dataSource={payments}
              className="rounded-lg overflow-hidden"
              renderItem={(item) => (
                <List.Item className="flex items-center justify-between bg-white p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex-grow">
                    <Text strong className="text-green-600 text-lg">{formatCurrency(item.amount)}</Text>
                    <Text className="ml-2 text-gray-700">via {item.method || 'N/A'}</Text>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(item.date)} by {item.addedBy || 'Unknown'}
                  </div>
                </List.Item>
              )}
            />
          )}
        </TabPane>

        {/* Notes Tab */}
        <TabPane
          tab={
            <span className="flex items-center space-x-1">
              <BookOutlined />
              <span>Notes ({sortedNotes.length})</span>
            </span>
          }
          key="5"
        >
          {sortedNotes.length === 0 ? (
            <Empty description="No notes available for this customer." className="py-8" />
          ) : (
            <List
              bordered
              dataSource={sortedNotes}
              className="rounded-lg overflow-hidden"
              renderItem={(item) => (
                <List.Item className="flex flex-col items-start bg-white p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-full">
                    <div className="text-gray-800 text-base leading-relaxed mb-1">
                      <Text strong>Note:</Text> {item.text || 'No text provided'}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Added by: <Text italic>{item.author || item.addedBy?.name || item.addedBy?.email || 'Unknown'}</Text> | {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CustomerProfile;
