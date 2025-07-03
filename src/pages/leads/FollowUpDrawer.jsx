import React, { useState, useEffect } from 'react';
import {
  Drawer, Button, Input, DatePicker, Tabs, List, Typography, Divider, Modal
} from 'antd';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import moment from 'moment';

const { TextArea } = Input;
const { TabPane } = Tabs;

const FollowUpDrawer = ({ visible, onClose, account, refreshAccounts }) => {
  const [comment, setComment] = useState('');
  const [followupDate, setFollowupDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (visible && account?._id) fetchFollowUps();
  }, [visible, account]);

  const fetchFollowUps = async () => {
    try {
      const res = await axios.get(`/api/accounts/${account._id}/followups`);
      setFollowUps(res.data || []);
    } catch {
      toast.error('Failed to fetch follow-ups');
    }
  };

  const handleAddOrUpdate = () => {
    if (!comment || !followupDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const addedBy = user?._id;
    if (!addedBy) {
      toast.error('User not found');
      return;
    }

    setLoading(true);

    const payload = {
      date: followupDate.format('YYYY-MM-DD'),
      note: comment,
      addedBy
    };

    const request = editingIndex === null
      ? axios.post(`/api/accounts/${account._id}/followups`, payload)
      : axios.put(`/api/accounts/${account._id}/followups/${editingIndex}`, payload);

    request
      .then(() => {
        toast.success(editingIndex === null ? 'Follow-up added' : 'Follow-up updated');
        setComment('');
        setFollowupDate(null);
        setEditingIndex(null);
        fetchFollowUps();
        refreshAccounts();
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Failed to save follow-up');
      })
      .finally(() => setLoading(false));
  };

  const handleEdit = (index) => {
    const f = followUps[index];
    setComment(f.note);
    setFollowupDate(moment(f.date));
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    Modal.confirm({
      title: 'Delete Follow-up',
      content: 'Are you sure you want to delete this follow-up?',
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: { danger: true },
      onOk: () => {
        axios.delete(`/api/accounts/${account._id}/followups/${index}`)
          .then(() => {
            toast.success('Follow-up deleted');
            fetchFollowUps();
            refreshAccounts();
          })
          .catch(() => toast.error('Failed to delete follow-up'));
      }
    });
  };

  const today = moment().format('YYYY-MM-DD');
  const sorted = [...followUps].sort((a, b) => new Date(b.date) - new Date(a.date));

  const todayFollowUps = sorted.filter(f =>
    moment(f.date).format('YYYY-MM-DD') === today
  );
  const upcoming = sorted.filter(f =>
    moment(f.date).isAfter(today, 'day')
  );
  const past = sorted.filter(f =>
    moment(f.date).isBefore(today, 'day')
  );

  const renderFollowUpItem = (item, index) => (
    <List.Item
      actions={[
        <a key="edit" onClick={() => handleEdit(index)}>Edit</a>,
        <a key="delete" onClick={() => handleDelete(index)}>Delete</a>
      ]}
    >
      <div>
        <Typography.Text strong>
          {moment(item.date).format('DD-MM-YYYY')}
        </Typography.Text><br />
        {item.note}<br />
        <Typography.Text type="secondary">
          By {item.addedBy?.name || item.addedBy?.email || 'Unknown'}
        </Typography.Text>
      </div>
    </List.Item>
  );

  return (
    <Drawer
      title={`Follow-ups: ${account?.businessName}`}
      open={visible}
      onClose={() => {
        setEditingIndex(null);
        setComment('');
        setFollowupDate(null);
        onClose();
      }}
      width={720}
    >
      <div style={{ marginBottom: 20 }}>
        <DatePicker
          style={{ width: '100%', marginBottom: 8 }}
          format="DD-MM-YYYY"
          value={followupDate}
          onChange={(date) => setFollowupDate(date)}
        />
        <TextArea
          rows={4}
          placeholder="Enter follow-up note"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button
          type="primary"
          block
          onClick={handleAddOrUpdate}
          loading={loading}
          style={{ marginTop: 10 }}
        >
          {editingIndex === null ? 'Add Follow-up' : 'Update Follow-up'}
        </Button>
      </div>

      <Divider />
      <Tabs defaultActiveKey="today">
        <TabPane tab={`Today's Follow-ups (${todayFollowUps.length})`} key="today">
          <List
            dataSource={todayFollowUps}
            renderItem={(item, index) => renderFollowUpItem(item, followUps.indexOf(item))}
            locale={{ emptyText: 'No follow-ups for today' }}
          />
        </TabPane>
        <TabPane tab={`Upcoming Follow-ups (${upcoming.length})`} key="upcoming">
          <List
            dataSource={upcoming}
            renderItem={(item, index) => renderFollowUpItem(item, followUps.indexOf(item))}
            locale={{ emptyText: 'No upcoming follow-ups' }}
          />
        </TabPane>
        <TabPane tab={`Past Follow-ups (${past.length})`} key="past">
          <List
            dataSource={past}
            renderItem={(item, index) => renderFollowUpItem(item, followUps.indexOf(item))}
            locale={{ emptyText: 'No past follow-ups' }}
          />
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

export default FollowUpDrawer;
