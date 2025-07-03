import { Layout } from 'antd';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useState, useCallback } from 'react'; // Import useCallback for memoization
import './layout.css'; // Keep CSS for now, but consider CSS-in-JS for larger projects

const { Sider, Content, Header } = Layout;

const MainLayout = ({ children }) => {
  // State for sidebar collapse, initialized to false (expanded)
  const [collapsed, setCollapsed] = useState(false);

  // Memoize the onCollapse handler for performance
  const handleCollapse = useCallback((isCollapsed) => {
    setCollapsed(isCollapsed);
  }, []);

  return (
    <Layout className="main-layout">
      <Sider
        collapsible // Allows the sider to be collapsed
        collapsed={collapsed} // Controls the collapsed state
        onCollapse={handleCollapse} // Callback for collapse event
        breakpoint="lg" // Ant Design's recommended breakpoint for responsive layouts
        collapsedWidth="80" // A slightly larger collapsed width for better icon visibility
        className="sidebar"
        theme="light" // Explicitly set theme for a cleaner look if desired
      >
        {/* Pass the collapsed state to the Sidebar component */}
        <Sidebar collapsed={collapsed} />
      </Sider>
      <Layout>
        <Header className="top-navbar">
          {/* TopNavbar might need to adjust its content based on collapsed state too */}
          <TopNavbar collapsed={collapsed} setCollapsed={setCollapsed} />
        </Header>
        <Content className="main-content">
          <div className="inner-content">
            {children} {/* Renders the content of your page */}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;  