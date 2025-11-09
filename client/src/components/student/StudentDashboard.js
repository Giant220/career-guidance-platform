import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentProfile from './StudentProfile';
import CourseApplication from './CourseApplication';
import AdmissionsResults from './AdmissionsResults';
import JobApplications from './JobApplications';
import TranscriptUpload from './TranscriptUpload';
import GradesEntry from './GradesEntry';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="student-dashboard">
      <nav className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77',opacity:0}}></div>
          <span className="brand">Student Portal</span>
        </div>
        <div className="nav-links">
          <Link to="/student" onClick={() => setActiveTab('dashboard')}>Dashboard</Link>
          <Link to="/student/profile" onClick={() => setActiveTab('profile')}>Profile</Link>
          <Link to="/student/courses" onClick={() => setActiveTab('courses')}>Courses</Link>
          <Link to="/student/admissions" onClick={() => setActiveTab('admissions')}>Admissions</Link>
          <Link to="/student/jobs" onClick={() => setActiveTab('jobs')}>Jobs</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<StudentHome />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/courses" element={<CourseApplication />} />
          <Route path="/admissions" element={<AdmissionsResults />} />
          <Route path="/jobs" element={<JobApplications />} />
          <Route path="/transcript" element={<TranscriptUpload />} />
          <Route path="/grades" element={<GradesEntry />} />
        </Routes>
      </div>
    </div>
  );
};

const StudentHome = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    applications: 0,
    admissions: 0,
    jobsApplied: 0,
    qualifiedCourses: 0
  });

  useEffect(() => {
    // Fetch student stats
    const fetchStats = async () => {
      // Mock data - replace with actual API calls
      setStats({
        applications: 3,
        admissions: 1,
        jobsApplied: 2,
        qualifiedCourses: 15
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="student-home">
      <div className="section">
        <h1>Welcome, {currentUser?.displayName || 'Student'}!</h1>
        <p>Manage your educational journey and career path</p>
        
        <div className="dashboard-top">
          <div className="card">
            <h3>Course Applications</h3>
            <p className="stat-number">{stats.applications}</p>
          </div>
          <div className="card">
            <h3>Admissions</h3>
            <p className="stat-number">{stats.admissions}</p>
          </div>
          <div className="card">
            <h3>Jobs Applied</h3>
            <p className="stat-number">{stats.jobsApplied}</p>
          </div>
          <div className="card">
            <h3>Qualified Courses</h3>
            <p className="stat-number">{stats.qualifiedCourses}</p>
          </div>
        </div>

        <div className="quick-actions stats-grid">
          <div className="card quick-action-card">
            <h3>Enter Your Grades</h3>
            <p>Add your LGCSE results to see qualified courses</p>
            <Link to="/student/grades" className="btn">Enter Grades</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Apply for Courses</h3>
            <p>Browse and apply to institutions</p>
            <Link to="/student/courses" className="btn">View Courses</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Check Admissions</h3>
            <p>View your application status</p>
            <Link to="/student/admissions" className="btn">View Status</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Upload Transcript</h3>
            <p>Add your academic transcripts</p>
            <Link to="/student/transcript" className="btn">Upload</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
