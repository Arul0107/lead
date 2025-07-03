import { Avatar, Dropdown, Menu, Space } from 'antd';
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const TopNavbar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const menu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={handleProfile}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={handleSettings}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  const getInitial = () => {
    if (!user) return 'U';
    return user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 64,
      padding: '0 16px',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Sidebar toggle - optional */}
      <div style={{ display: 'flex', alignItems: 'center' }} onClick={() => setCollapsed(!collapsed)}>
        {/* Add toggle icon if needed */}
      </div>

      {/* Avatar */}
      <Space>
        <Dropdown overlay={menu} placement="bottomRight" arrow>
          <Avatar
            style={{
              backgroundColor: '#1677ff',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {getInitial()}
          </Avatar>
        </Dropdown>
      </Space>
    </div>
  );
};

export default TopNavbar;
