import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="main-content">
      <div className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77' }}></div>
          <span className="brand">Career Bridge Lesotho</span>
        </div>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
      </div>

      <div className="section text-center">
        <h1>Welcome to Career Bridge Lesotho</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Your pathway from education to employment in Lesotho
        </p>

        <div className="stats-grid">
          <div className="card">
            <h3>For Students</h3>
            <p>Discover courses and career opportunities</p>
            <Link to="/signup?role=student" className="btn" style={{ marginTop: '1rem' }}>
              Join as Student
            </Link>
          </div>

          <div className="card">
            <h3>For Institutions</h3>
            <p>Manage courses and admissions</p>
            <Link to="/signup?role=institute" className="btn" style={{ marginTop: '1rem' }}>
              Join as Institution
            </Link>
          </div>

          <div className="card">
            <h3>For Companies</h3>
            <p>Find qualified graduates</p>
            <Link to="/signup?role=company" className="btn" style={{ marginTop: '1rem' }}>
              Join as Company
            </Link>
          </div>

          <div className="card">
            <h3>Administration</h3>
            <p>System management</p>
            <Link to="/login" className="btn" style={{ marginTop: '1rem' }}>
              Admin Login
            </Link>
          </div>
        </div>

        <div className="section mt-1">
          <h2>How It Works</h2>
          <div className="stats-grid">
            <div className="card">
              <h3 className="text-gold">1. Explore</h3>
              <p>Browse institutions and courses across Lesotho</p>
            </div>
            <div className="card">
              <h3 className="text-gold">2. Apply</h3>
              <p>Submit applications to your preferred programs</p>
            </div>
            <div className="card">
              <h3 className="text-gold">3. Study</h3>
              <p>Get admitted and pursue your education</p>
            </div>
            <div className="card">
              <h3 className="text-gold">4. Career</h3>
              <p>Connect with employers after graduation</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Career Bridge Lesotho &copy; 2024 - Connecting Education to Employment</p>
      </footer>
    </div>
  );
};

export default Landing;