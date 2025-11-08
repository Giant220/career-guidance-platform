import { db } from '../config/firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Convert PDF file to Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Validate PDF file
export const validatePDFFile = (file, maxSizeKB = 500) => {
  const errors = [];
  
  if (file.type !== 'application/pdf') {
    errors.push('Only PDF files are allowed');
  }
  
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    errors.push('File must have .pdf extension');
  }
  
  if (file.size > maxSizeKB * 1024) {
    errors.push(`File size must be less than ${maxSizeKB}KB`);
  }
  
  return { isValid: errors.length === 0, errors: errors };
};

// Upload PDF to Firestore as Base64
export const uploadPDFToFirestore = async (file, userId, metadata = {}) => {
  try {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    const base64Data = await fileToBase64(file);
    const docId = `pdf_${Date.now()}`;
    const docPath = `transcripts/${userId}/${docId}`;

    const documentData = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      base64Data: base64Data,
      userId: userId,
      uploadDate: new Date().toISOString(),
      ...metadata
    };

    await setDoc(doc(db, docPath), documentData);

    return {
      success: true,
      docId: docId,
      docPath: docPath,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user's PDFs
export const getUserPDFs = async (userId) => {
  try {
    const q = query(
      collection(db, 'transcripts', userId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const files = [];
    
    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, files: files };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete PDF
export const deletePDFFromFirestore = async (userId, docId) => {
  try {
    await deleteDoc(doc(db, 'transcripts', userId, docId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};