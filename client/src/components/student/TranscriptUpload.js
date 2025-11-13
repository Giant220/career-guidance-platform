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

  useEffect(() => { fetchTranscripts(); }, []);

  const fetchTranscripts = async () => {
    try {
      const response = await fetch(`/api/students/${currentUser?.uid}/transcripts`);
      const data = await response.json();
      setTranscripts(data);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
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

      const response = await fetch('/api/students/upload-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.uid,
          ...formData,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          docPath: uploadResult.docPath,
          uploadDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('PDF transcript uploaded successfully!');
        setFormData({ type: 'degree', institution: '', program: '', yearCompleted: '' });
        event.target.value = '';
        fetchTranscripts();
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
    }
  };

  const deleteTranscript = async (transcriptId, docPath) => {
    if (window.confirm('Delete this PDF transcript?')) {
      try {
        const parts = docPath.split('/');
        await deletePDFFromFirestore(parts[1], parts[2]);
        
        await fetch(`/api/students/transcripts/${transcriptId}`, { method: 'DELETE' });
        alert('PDF transcript deleted!');
        fetchTranscripts();
      } catch (error) {
        alert('Error deleting transcript');
      }
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
              <select value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}>
                <option value="degree">Degree</option>
                <option value="diploma">Diploma</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>
            <div className="form-group">
              <label>Institution</label>
              <input type="text" value={formData.institution} onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))} required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Program</label>
              <input type="text" value={formData.program} onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input type="number" value={formData.yearCompleted} onChange={(e) => setFormData(prev => ({ ...prev, yearCompleted: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label>PDF File</label>
            <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
            <small>Only PDF files under 500KB</small>
          </div>
          {uploading && <p>⏳ Uploading PDF...</p>}
        </div>
      </div>

      <div className="section">
        <h3>Your PDF Transcripts</h3>
        <div className="transcripts-list">
          {transcripts.map(transcript => (
            <div key={transcript.id} className="transcript-card">
              <div className="transcript-info">
                <h4>{transcript.program}</h4>
                <p>{transcript.institution} • {transcript.yearCompleted}</p>
                <p>{transcript.fileName} ({(transcript.fileSize / 1024).toFixed(1)}KB)</p>
              </div>
              <div className="transcript-actions">
                <button onClick={() => downloadPDF(transcript)} className="btn btn-secondary">Download</button>
                <button onClick={() => deleteTranscript(transcript.id, transcript.docPath)} className="btn btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TranscriptUpload;
