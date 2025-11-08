import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { currentUser, userRole } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('🛡️ ProtectedRoute State Update:');
    console.log('   - currentUser:', currentUser?.email);
    console.log('   - userRole:', userRole);
    console.log('   - required role:', role);
    console.log('   - current path:', location.pathname);
  }, [currentUser, userRole, role, location.pathname]);

  if (!currentUser) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && userRole !== role) {
    console.log(`❌ Role mismatch: user has '${userRole}', required '${role}', redirecting to home`);
    return <Navigate to="/" replace />;
  }

  console.log('✅ Access granted to protected route');
  return children;
};

export default ProtectedRoute;