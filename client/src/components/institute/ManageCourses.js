import React, { useState, useEffect } from 'react';

const ManageCourses = ({ institute }) => {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const [courseForm, setCourseForm] = useState({
    name: '',
    faculty: '',
    duration: '',
    fees: '',
    credits: '',
    description: '',
    requirements: [''],
    careerPaths: [''],
    intake: ''
  });

  useEffect(() => {
    if (institute) {
      fetchCourses();
      fetchFaculties();
    }
  }, [institute]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`/api/institutes/${institute.id}/courses`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await fetch(`/api/institutes/${institute.id}/faculties`);
      const data = await response.json();
      setFaculties(data);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequirementChange = (index, value) => {
    const newRequirements = [...courseForm.requirements];
    newRequirements[index] = value;
    setCourseForm(prev => ({
      ...prev,
      requirements: newRequirements
    }));
  };

  const addRequirement = () => {
    setCourseForm(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index) => {
    const newRequirements = courseForm.requirements.filter((_, i) => i !== index);
    setCourseForm(prev => ({
      ...prev,
      requirements: newRequirements
    }));
  };

  const handleCareerPathChange = (index, value) => {
    const newCareerPaths = [...courseForm.careerPaths];
    newCareerPaths[index] = value;
    setCourseForm(prev => ({
      ...prev,
      careerPaths: newCareerPaths
    }));
  };

  const addCareerPath = () => {
    setCourseForm(prev => ({
      ...prev,
      careerPaths: [...prev.careerPaths, '']
    }));
  };

  const removeCareerPath = (index) => {
    const newCareerPaths = courseForm.careerPaths.filter((_, i) => i !== index);
    setCourseForm(prev => ({
      ...prev,
      careerPaths: newCareerPaths
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const courseData = {
      ...courseForm,
      institutionId: institute.id,
      institutionName: institute.name,
      requirements: courseForm.requirements.filter(req => req.trim() !== ''),
      careerPaths: courseForm.careerPaths.filter(path => path.trim() !== '')
    };

    try {
      const url = editingCourse ? 
        `/api/institutes/courses/${editingCourse.id}` : 
        '/api/institutes/courses';
      
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData)
      });

      if (response.ok) {
        alert(editingCourse ? 'Course updated successfully!' : 'Course added successfully!');
        setShowForm(false);
        setEditingCourse(null);
        setCourseForm({
          name: '',
          faculty: '',
          duration: '',
          fees: '',
          credits: '',
          description: '',
          requirements: [''],
          careerPaths: [''],
          intake: ''
        });
        fetchCourses();
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      faculty: course.faculty,
      duration: course.duration,
      fees: course.fees,
      credits: course.credits,
      description: course.description,
      requirements: course.requirements.length > 0 ? course.requirements : [''],
      careerPaths: course.careerPaths.length > 0 ? course.careerPaths : [''],
      intake: course.intake
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/institutes/courses/${courseId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Course deleted successfully!');
          fetchCourses();
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course');
      }
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCourse(null);
    setCourseForm({
      name: '',
      faculty: '',
      duration: '',
      fees: '',
      credits: '',
      description: '',
      requirements: [''],
      careerPaths: [''],
      intake: ''
    });
  };

  if (loading) {
    return <div className="section">Loading courses...</div>;
  }

  return (
    <div className="section">
      <div className="flex-between mb-1">
        <div>
          <h1>Manage Courses</h1>
          <p>Add, edit, or remove courses offered by your institution</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn"
          disabled={institute?.status !== 'approved'}
        >
          + Add New Course
        </button>
      </div>

      {institute?.status !== 'approved' && (
        <div className="warning-message">
          <p>You cannot manage courses until your institution is approved by the administrator.</p>
        </div>
      )}

      {showForm && (
        <div className="section form-container">
          <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  name="name"
                  value={courseForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Faculty/Department *</label>
                <input
                  type="text"
                  name="faculty"
                  value={courseForm.faculty}
                  onChange={handleInputChange}
                  placeholder="e.g., Faculty of Science, School of Business, Department of Engineering"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duration *</label>
                <input
                  type="text"
                  name="duration"
                  value={courseForm.duration}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 3 years"
                />
              </div>
              <div className="form-group">
                <label>Fees *</label>
                <input
                  type="text"
                  name="fees"
                  value={courseForm.fees}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., M25,000 per year"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={courseForm.credits}
                  onChange={handleInputChange}
                  placeholder="e.g., 360"
                />
              </div>
              <div className="form-group">
                <label>Intake Periods</label>
                <input
                  type="text"
                  name="intake"
                  value={courseForm.intake}
                  onChange={handleInputChange}
                  placeholder="e.g., January, August"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={courseForm.description}
                onChange={handleInputChange}
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Entry Requirements *</label>
              {courseForm.requirements.map((requirement, index) => (
                <div key={index} className="requirement-input">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    placeholder="e.g., Mathematics C"
                    required
                  />
                  {courseForm.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRequirement}
                className="btn btn-secondary"
              >
                + Add Requirement
              </button>
            </div>

            <div className="form-group">
              <label>Career Paths</label>
              {courseForm.careerPaths.map((path, index) => (
                <div key={index} className="career-path-input">
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => handleCareerPathChange(index, e.target.value)}
                    placeholder="e.g., Software Developer"
                  />
                  {courseForm.careerPaths.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCareerPath(index)}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCareerPath}
                className="btn btn-secondary"
              >
                + Add Career Path
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn">
                {editingCourse ? 'Update Course' : 'Add Course'}
              </button>
              <button type="button" onClick={cancelForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="section">
        <h3>Your Courses ({courses.length})</h3>
        <div className="courses-list">
          {courses.map(course => (
            <div key={course.id} className="course-management-card">
              <div className="course-info">
                <h4>{course.name}</h4>
                <p className="faculty">{course.faculty}</p>
                <p className="duration">{course.duration} • {course.fees}</p>
                <p className="description">{course.description}</p>
                
                <div className="course-details">
                  <div className="detail-item">
                    <strong>Requirements:</strong>
                    <ul>
                      {course.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="detail-item">
                    <strong>Career Paths:</strong>
                    <ul>
                      {course.careerPaths.map((path, index) => (
                        <li key={index}>{path}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="course-actions">
                <button 
                  onClick={() => handleEdit(course)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(course.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center">
            <p>No courses found. Add your first course to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;