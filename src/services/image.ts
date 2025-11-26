import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '@services/firebase';

const storage = getStorage(app);

export const uploadImage = async (uri: string, folder: string): Promise<string> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}.jpg`;
    
    // Create reference
    const imageRef = ref(storage, filename);
    
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload the blob
    await uploadBytes(imageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(imageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};