// routes.jsx
import React from 'react';
import RoleGuard from '../components/auth/RoleGuard';

// Lazy-loaded pages - Correcting paths to match actual file system casing
const Dashboard = React.lazy(() => import('../pages/dashboard/Dashboard'));
const InvoiceDashboard = React.lazy(() => import('../pages/invoice/invoicedashboard'));
const Login = React.lazy(() => import('../pages/Login'));
const Profile = React.lazy(() => import('../pages/Profile'));
const Settings = React.lazy(() => import('../pages/Settings'));

// Corrected: Using 'quotation' (lowercase) based on the provided file structure image
const QuotationPage = React.lazy(() => import('../pages/quotation/QuotationPage'));
const QuotationForm = React.lazy(() => import('../pages/quotation/QuotationForm'));
const QuotationList = React.lazy(() => import('../pages/quotation/QuotationList'));

// Assuming your 'Invoice' folder is still PascalCase, as per previous structure
const InvoicePage = React.lazy(() => import('../pages/Invoice/InvoicePage'));
const InvoiceForm = React.lazy(() => import('../pages/Invoice/InvoiceForm'));
const InvoiceList = React.lazy(() => import('../pages/Invoice/InvoiceList'));

const Leads = React.lazy(() => import('../pages/leads/Leads'));
const Customers = React.lazy(() => import('../pages/leads/Customers'));
const CustomerProfile = React.lazy(() => import('../components/CustomerProfile'));

const UserManagement = React.lazy(() => import('../pages/user/UserManagement'));

const Product = React.lazy(() => import('../pages/product/Product'));

// Protected app routes
export const appRoutes = [
  {
    path: '/dashboard',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin', 'Employee']}>
        <Dashboard />
      </RoleGuard>
    ),
  },
  {
    path: '/invoicedashboard',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin', 'Employee']}>
        <InvoiceDashboard />
      </RoleGuard>
    ),
  },
  {
    path: '/profile',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin', 'Employee']}>
        <Profile />
      </RoleGuard>
    ),
  },
  {
    path: '/settings',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin', 'Employee']}>
        <Settings />
      </RoleGuard>
    ),
  },
  {
    path: '/leads',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <Leads />
      </RoleGuard>
    ),
  },
  {
    path: '/customers',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <Customers />
      </RoleGuard>
    ),
  },
  {
    path: '/customers/:id',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <CustomerProfile />
      </RoleGuard>
    ),
  },
  {
    path: '/invoice',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <InvoicePage />
      </RoleGuard>
    ),
  },
  {
    path: '/products',    
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <Product />
      </RoleGuard>
    ),
  },
  {
    path: '/invoice/form',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <InvoiceForm />
      </RoleGuard>
    ),
  },
  {
    path: '/invoice/list',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <InvoiceList />
      </RoleGuard>
    ),
  },
  {
    path: '/quotation',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <QuotationPage />
      </RoleGuard>
    ),
  },
  {
    path: '/quotation/form',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <QuotationForm />
      </RoleGuard>
    ),
  },
  {
    path: '/quotation/list',
    element: (
      <RoleGuard allowedRoles={['Admin', 'Superadmin']}>
        <QuotationList />
      </RoleGuard>
    ),
  },
  {
    path: '/users',
    element: (
      <RoleGuard allowedRoles={['Superadmin']}>
        <UserManagement />
      </RoleGuard>
    ),
  },
];

// Public login routes
export const loginRoutes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Login />
  },
];
