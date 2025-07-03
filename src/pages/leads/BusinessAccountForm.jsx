// BusinessAccountForm.jsx
import React, { useEffect, useState } from 'react'; // Added useEffect and useState
import { Form, Input, Button, Drawer, Row, Col, InputNumber, Select, Spin } from 'antd'; // Added Spin
import { toast } from 'react-hot-toast';

const { TextArea } = Input;
const { Option } = Select;

// Added 'allUsers' prop for the dropdown, and 'loadingUsers' for UI feedback
const BusinessAccountForm = ({ visible, onClose, onSave, initialValues, allUsers, loadingUsers }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // Changed from React.useState
  const sourceType = Form.useWatch('sourceType', form); // Watch for changes in sourceType

  useEffect(() => { // Changed from React.useEffect
    form.resetFields();
    if (initialValues) {
      // Set initial values for all fields, including assignedTo
      form.setFieldsValue({ 
        ...initialValues,
        assignedTo: initialValues.assignedTo?._id || null // Set assignedTo to ID or null
      });
    } else {
      // Set default value for sourceType, status, and assignedTo when adding a new account
      form.setFieldsValue({ 
        sourceType: 'Direct', 
        status: 'Active',
        assignedTo: null // Default to unassigned for new accounts
      }); 
    }
  }, [initialValues, form]);

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        setLoading(true);
        const timestamp = new Date().toLocaleString();
        const newNote = values.noteInput
          ? { text: values.noteInput, timestamp }
          : null;

        const existingNotes = initialValues?.notes || [];
        const updatedNotes = newNote ? [...existingNotes, newNote] : existingNotes;

        const dataToSave = {
          ...values,
          notes: updatedNotes,
          // Include assignedTo field directly from form values
          // If the selected value is null, it will correctly unassign
          assignedTo: values.assignedTo === null ? null : values.assignedTo, 
        };

        // Remove noteInput as it's not part of the schema
        delete dataToSave.noteInput;

        // If sourceType is not 'Facebook Referral', ensure referralPersonName is not sent
        if (dataToSave.sourceType !== 'Facebook Referral') {
          delete dataToSave.referralPersonName;
        }

        onSave(dataToSave);
        toast.success(`Account ${initialValues ? 'updated' : 'created'} successfully!`);
        setLoading(false);
        onClose();
      })
      .catch(info => {
        console.log('Validate Failed:', info);
        toast.error('Please fill in all required fields correctly.');
      });
  };

  return (
    <Drawer
      title={initialValues ? 'Edit Business Account' : 'Create New Business Account'}
      width={720}
      onClose={onClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>Cancel</Button>
          <Button onClick={handleSubmit} type="primary" loading={loading}>
            {initialValues ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        // initialValues prop is handled by useEffect for dynamic setting
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="businessName" label="Business Name" rules={[{ required: true, message: 'Please enter business name' }]}>
              <Input placeholder="Business Name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="gstNumber" label="GST Number" rules={[{ required: true, message: 'Please enter GST Number' }]}>
              <Input placeholder="GST Number" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="contactName" label="Contact Person Name" rules={[{ required: true, message: 'Please enter contact person name' }]}>
              <Input placeholder="Contact Person Name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please enter email' }]}>
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phoneNumber" label="Phone Number">
              <Input placeholder="Phone Number (Optional)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="mobileNumber" label="Mobile Number" rules={[{ required: true, message: 'Please enter mobile number' }]}>
              <Input placeholder="Mobile Number" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="addressLine1" label="Address Line 1" rules={[{ required: true, message: 'Please enter address line 1' }]}>
          <Input placeholder="Address Line 1" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="addressLine2" label="Address Line 2">
              <Input placeholder="Address Line 2 (Optional)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="addressLine3" label="Address Line 3">
              <Input placeholder="Address Line 3 (Optional)" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="landmark" label="Landmark">
          <Input placeholder="Landmark (Optional)" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="city" label="City" rules={[{ required: true, message: 'Please enter city' }]}>
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="pincode" label="Pincode" rules={[{ required: true, message: 'Please enter pincode' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="Pincode" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="state" label="State" rules={[{ required: true, message: 'Please enter state' }]}>
              <Input placeholder="State" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="country" label="Country" rules={[{ required: true, message: 'Please enter country' }]}>
          <Input placeholder="Country" />
        </Form.Item>
        <Form.Item name="website" label="Website URL" rules={[{ type: 'url', message: 'Invalid URL format' }]}>
          <Input placeholder="https://www.example.com" />
        </Form.Item>

        <Form.Item name="type" label="Lead Type" rules={[{ required: true, message: 'Please select a lead type' }]}>
          <Select placeholder="Select Type">
            <Option value="Hot">Hot</Option>
            <Option value="Warm">Warm</Option>
            <Option value="Cold">Cold</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Account Status"
          rules={[{ required: true, message: 'Please select an account status' }]}
        >
          <Select placeholder="Select Status">
            <Option value="Active">Active</Option>
            <Option value="Inactive">Inactive</Option>
            <Option value="Waiting">Waiting</Option>
            <Option value="Closed">Closed</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="sourceType"
          label="Source Type"
          rules={[{ required: true, message: 'Please select a source type' }]}
        >
          <Select placeholder="How did you hear about us?">
            <Option value="Direct">Direct</Option>
            <Option value="Facebook Referral">Facebook Referral</Option>
            <Option value="Google Ads">Google Ads</Option>
            <Option value="Website">Website</Option>
            <Option value="Cold Call">Cold Call</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>

        {sourceType === 'Facebook Referral' && (
          <Form.Item
            name="referralPersonName"
            label="Referral Person Name"
            rules={[{ required: true, message: 'Please enter the referral person\'s name' }]}
          >
            <Input placeholder="Name of the person who referred from Facebook" />
          </Form.Item>
        )}

        {/* ✨ NEW: Assigned To Field ✨ */}
        <Form.Item
          name="assignedTo"
          label="Assigned To"
        >
          <Select
            placeholder="Select a user to assign to (optional)"
            allowClear // Allows clearing the selection to unassign
            loading={loadingUsers} // Show loading state for users
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {/* The value for Option should be the user's _id */}
            {allUsers && allUsers.map(user => (
              <Option key={user._id} value={user._id}>
                {user.name} ({user.role})
              </Option>
            ))}
          </Select>
        </Form.Item>
        {/* End of NEW: Assigned To Field */}

        <Form.Item name="noteInput" label="Add Note">
          <TextArea rows={3} placeholder="Add a note (it will be timestamped)" />
        </Form.Item>

        {initialValues?.notes?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <label><strong>Previous Notes</strong></label>
            <ul style={{ paddingLeft: 20 }}>
              {initialValues.notes.map((note, index) => (
                <li key={index}><strong>{note.timestamp}:</strong> {note.text}</li>
              ))}
            </ul>
          </div>
        )}
      </Form>
    </Drawer>
  );
};

export default BusinessAccountForm;