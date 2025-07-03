import { Navigate } from 'react-router-dom';

const RoleGuard = ({ allowedRoles = [], children }) => {
  let user;

  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (error) {
    console.error('Invalid user object in localStorage', error);
    return <Navigate to="/login" replace />;
  }

  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;

  // ❌ Do not show the element if role is not allowed
  if (!allowedRoles.includes(userRole)) {
    return null; // <== This ensures it doesn't render OR navigate
  }

  return children;
};

export default RoleGuard;
