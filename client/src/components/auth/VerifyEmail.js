import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';

const VerifyEmail = () => {
  const { currentUser, logout } = useAuth();

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(currentUser);
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      alert('Error sending verification email: ' + error.message);
    }
  };

  return (
    <div className="section">
      <div className="verification-reminder" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
        <h2>Verify Your Email</h2>
        <p>We've sent a verification link to: <strong>{currentUser?.email}</strong></p>
        <p>Please check your email and click the verification link to activate your account.</p>
        
        <div className="action-buttons" style={{ margin: '2rem 0' }}>
          <button onClick={handleResendVerification} className="btn" style={{ margin: '0.5rem' }}>
            Resend Verification Email
          </button>
          <button onClick={logout} className="btn btn-secondary" style={{ margin: '0.5rem' }}>
            Go to Login
          </button>
        </div>
        
        <div className="tips" style={{ textAlign: 'left', marginTop: '2rem' }}>
          <h4>Didn't receive the email?</h4>
          <ul>
            <li>Check your spam folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes - it may take some time to arrive</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
