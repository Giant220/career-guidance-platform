import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadPDFToFirestore, getUserPDFs, deletePDFFromFirestore } from '../../utils/firebaseStorage';

const TranscriptUpload = () => {
  const { currentUser } = useAuth();
  const [transcripts, setTranscripts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'degree',
    institution: '',
    program: '',
    yearCompleted: ''
  });

  useEffect(() => { 
    if (currentUser) {
      fetchTranscripts(); 
    }
  }, [currentUser]);

  const fetchTranscripts = async () => {
    try {
      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/students/${currentUser.uid}/transcripts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // ✅ ENSURE DATA IS ALWAYS AN ARRAY
      if (Array.isArray(data)) {
        setTranscripts(data);
      } else {
        console.error('Invalid response format:', data);
        setTranscripts([]);
      }
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      setTranscripts([]); // Set empty array on error
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      const uploadResult = await uploadPDFToFirestore(file, currentUser.uid, {
        institution: formData.institution,
        program: formData.program,
        yearCompleted: formData.yearCompleted,
        documentType: formData.type
      });

      if (!uploadResult.success) throw new Error(uploadResult.error);

      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/students/upload-transcript', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: currentUser.uid,
          ...formData,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          docPath: uploadResult.docPath,
          uploadDate: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('PDF transcript uploaded successfully!');
        setFormData({ type: 'degree', institution: '', program: '', yearCompleted: '' });
        event.target.value = '';
        fetchTranscripts();
      } else {
        alert(`Error: ${result.error || 'Failed to upload transcript'}`);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadPDF = (transcript) => {
    if (transcript.base64Data) {
      const link = document.createElement('a');
      link.href = transcript.base64Data;
      link.download = transcript.fileName;
      link.click();
    } else {
      alert('No file data available for download');
    }
  };

  const deleteTranscript = async (transcriptId, docPath) => {
    if (!window.confirm('Are you sure you want to delete this transcript?')) return;
    
    try {
      // Delete from Firebase Storage
      if (docPath) {
        const parts = docPath.split('/');
        if (parts.length >= 3) {
          await deletePDFFromFirestore(parts[1], parts[2]);
        }
      }

      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/students/transcripts/${transcriptId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Transcript deleted successfully!');
        fetchTranscripts();
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete transcript');
      }
    } catch (error) {
      console.error('Error deleting transcript:', error);
      alert('Error deleting transcript: ' + error.message);
    }
  };

  return (
    <div className="section">
      <h1>Academic Transcripts</h1>
      
      <div className="section">
        <h3>Upload New Transcript (PDF only, max 500KB)</h3>
        <div className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Document Type</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="form-select"
              >
                <option value="degree">Degree</option>
                <option value="diploma">Diploma</option>
                <option value="certificate">Certificate</option>
                <option value="highschool">High School</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Institution *</label>
              <input 
                type="text" 
                value={formData.institution} 
                onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))} 
                required 
                placeholder="e.g., National University of Lesotho"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Program/Qualification *</label>
              <input 
                type="text" 
                value={formData.program} 
                onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))} 
                required 
                placeholder="e.g., Bachelor of Science in Computer Science"
              />
            </div>
            <div className="form-group">
              <label>Year Completed</label>
              <input 
                type="number" 
                min="1950" 
                max="2030"
                value={formData.yearCompleted} 
                onChange={(e) => setFormData(prev => ({ ...prev, yearCompleted: e.target.value }))} 
                placeholder="e.g., 2023"
              />
            </div>
          </div>

          <div className="form-group">
            <label>PDF File *</label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload} 
              disabled={uploading} 
              required
            />
            <small>Only PDF files under 500KB are allowed</small>
          </div>
          
          {uploading && (
            <div className="uploading-message">
              <p>Uploading PDF... Please wait.</p>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h3>Your Transcripts ({transcripts.length})</h3>
        <div className="transcripts-list">
          {Array.isArray(transcripts) && transcripts.length > 0 ? (
            transcripts.map(transcript => (
              <div key={transcript.id} className="transcript-card">
                <div className="transcript-info">
                  <h4>{transcript.program || 'Unknown Program'}</h4>
                  <p>
                    <strong>Institution:</strong> {transcript.institution || 'Unknown'} • 
                    <strong> Year:</strong> {transcript.yearCompleted || 'Not specified'}
                  </p>
                  <p>
                    <strong>File:</strong> {transcript.fileName || 'Unknown file'} • 
                    <strong> Size:</strong> {transcript.fileSize ? `(${(transcript.fileSize / 1024).toFixed(1)}KB)` : 'Unknown size'}
                  </p>
                  <p>
                    <strong>Type:</strong> {transcript.documentType || transcript.type || 'Not specified'} • 
                    <strong> Uploaded:</strong> {transcript.uploadDate ? new Date(transcript.uploadDate).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
                <div className="transcript-actions">
                  <button 
                    onClick={() => downloadPDF(transcript)} 
                    className="btn btn-secondary"
                  >
                    Download
                  </button>
                  <button 
                    onClick={() => deleteTranscript(transcript.id, transcript.docPath)} 
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center">
              <p>No transcripts uploaded yet.</p>
              <p>Upload your first transcript to get started with job applications.</p>
            </div>
          )}
        </div>
      </div>

      <div className="section info-message">
        <h3>Why Upload Transcripts?</h3>
        <ul>
          <li><strong>Job Applications:</strong> Required for automatic qualification checks</li>
          <li><strong>Course Applications:</strong> Some institutions may require additional documentation</li>
          <li><strong>Career Guidance:</strong> Helps us provide better career recommendations</li>
          <li><strong>Portfolio Building:</strong> Keep all your academic records in one place</li>
        </ul>
      </div>
    </div>
  );
};

export default TranscriptUpload;
