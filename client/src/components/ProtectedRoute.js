import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VerifyEmail from './auth/VerifyEmail';

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

  // Check email verification for all roles except admin
  if (currentUser && !currentUser.emailVerified && userRole !== 'admin') {
    console.log('📧 Email not verified, showing verification reminder');
    return <VerifyEmail />;
  }

  if (role && userRole !== role) {
    console.log(`❌ Role mismatch: user has '${userRole}', required '${role}', redirecting to home`);
    return <Navigate to="/" replace />;
  }

  console.log('✅ Access granted to protected route');
  return children;
};

export default ProtectedRoute;
