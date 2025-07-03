import { useState, useEffect } from 'react';
import { Drawer, message } from 'antd';
import axios from '../../api/axios';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import NotesDrawer from './NotesDrawer';

const InvoicePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [notesDrawerVisible, setNotesDrawerVisible] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/invoices');
      setInvoices(res.data);
    } catch {
      message.error('Failed to fetch invoices');
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSave = async (invoiceData) => {
    try {
      // --- IMPORTANT DEBUGGING STEP ---
      console.log("Invoice data being sent:", invoiceData); // Check this in your browser's console!
      // --- END DEBUGGING STEP ---

      if (currentInvoice && currentInvoice._id) {
        await axios.put(`/api/invoices/${currentInvoice._id}`, invoiceData);
        message.success('Invoice updated successfully');
      } else {
        await axios.post('/api/invoices', invoiceData);
        message.success('Invoice created successfully');
      }
      fetchInvoices();
      setShowForm(false);
      setCurrentInvoice(null);
    } catch (err) {
      console.error(err);
      // Log the full response data for more specific error messages from the backend
      console.error("Server error response:", err?.response?.data);
      message.error(err?.response?.data?.message || 'Failed to save invoice');
    }
  };

  const handleEdit = (invoice) => {
    setCurrentInvoice(invoice);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/invoices/${id}`);
      message.success('Invoice deleted');
      fetchInvoices();
    } catch {
      message.error('Delete failed');
    }
  };

  const handleSearch = (text) => {
    const value = text.toLowerCase();
    const filtered = invoices.filter(inv =>
      inv?.businessName?.toLowerCase().includes(value) ||
      inv?.invoiceNumber?.toLowerCase().includes(value) ||
      inv?.customerName?.toLowerCase().includes(value)
    );
    setFilteredInvoices(filtered);
  };

  const handleClose = () => {
    setShowForm(false);
    setCurrentInvoice(null);
  };

  return (
    <div style={{ padding: 24 }}>
      <InvoiceList
        invoices={filteredInvoices.length > 0 ? filteredInvoices : invoices}
        onAddNew={() => {
          setCurrentInvoice(null); // Ensure currentInvoice is null for new invoice
          setShowForm(true);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={handleSearch}
        refreshInvoices={fetchInvoices}
        onViewNotes={(invoice) => {
          setCurrentInvoice(invoice);
          setNotesDrawerVisible(true);
        }}
      />

      <Drawer
        title={currentInvoice ? 'Edit Invoice' : 'Create Invoice'}
        open={showForm}
        onClose={handleClose}
        width="80%"
        destroyOnClose
      >
        <InvoiceForm
          onCancel={handleClose}
          onSave={handleSave}
          // Ensure initialValues provides all necessary fields, even if null/undefined for new invoices
          initialValues={currentInvoice || {
            invoiceType: 'Invoice', // Provide a default if starting fresh
            items: [], // Crucial: ensure items array is always present
            taxRate: 18,
            discountAmount: 0,
            // Add other default empty strings or values for denormalized fields
            businessName: '',
            customerName: '',
            customerAddress: '',
            customerGSTIN: '',
            companyGSTIN: '',
            companyName: '',
            companyAddress: '',
            contactPerson: '',
            contactNumber: '',
            paymentTerms: '',
          }}
        />
      </Drawer>

      {currentInvoice && (
        <NotesDrawer
          visible={notesDrawerVisible}
          onClose={() => setNotesDrawerVisible(false)}
          invoice={currentInvoice}
          refreshInvoices={fetchInvoices}
        />
      )}
    </div>
  );
};

export default InvoicePage;