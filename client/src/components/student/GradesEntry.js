import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const GradesEntry = () => {
  const { currentUser } = useAuth();
  const [grades, setGrades] = useState({});
  const [saved, setSaved] = useState(false);

  const subjects = [
    'English', 'Mathematics', 'Science', 'Biology', 'Chemistry', 'Physics',
    'History', 'Geography', 'Commerce', 'Accounting', 'Computer Studies',
    'Art', 'Religious Studies', 'Sesotho', 'French'
  ];

  const gradeOptions = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'Not Taken'];

  const handleGradeChange = (subject, grade) => {
    setGrades(prev => ({
      ...prev,
      [subject]: grade
    }));
    setSaved(false);
  };

  const handleSaveGrades = async () => {
    try {
      // Save grades to Firebase
      const response = await fetch('/api/students/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentUser.uid,
          grades: grades
        })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving grades:', error);
    }
  };

  return (
    <div className="section">
      <h1>Enter Your LGCSE Grades</h1>
      <p>Enter your grades to see which courses you qualify for</p>

      <div className="form-container">
        <div className="grades-grid">
          {subjects.map(subject => (
            <div key={subject} className="grade-input-card">
              <label className="text-gold">{subject}</label>
              <select
                value={grades[subject] || ''}
                onChange={(e) => handleGradeChange(subject, e.target.value)}
                className="form-select"
              >
                <option value="">Select Grade</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex-between mt-1">
          <div>
            {saved && <div className="success">Grades saved successfully!</div>}
          </div>
          <button onClick={handleSaveGrades} className="btn">
            Save Grades
          </button>
        </div>
      </div>

      <div className="section mt-1">
        <h3>Grade Legend</h3>
        <div className="grade-legend">
          <div className="legend-item">
            <span className="grade-badge A-star">A*</span>
            <span>Distinction</span>
          </div>
          <div className="legend-item">
            <span className="grade-badge A">A</span>
            <span>Excellent</span>
          </div>
          <div className="legend-item">
            <span className="grade-badge B">B</span>
            <span>Very Good</span>
          </div>
          <div className="legend-item">
            <span className="grade-badge C">C</span>
            <span>Good (Credit)</span>
          </div>
          <div className="legend-item">
            <span className="grade-badge D">D</span>
            <span>Pass</span>
          </div>
          <div className="legend-item">
            <span className="grade-badge E">E</span>
            <span>Weak Pass</span>
          </div>
          <div className="legend-item">
            <span className="grade-badge F">F</span>
            <span>Fail</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesEntry;