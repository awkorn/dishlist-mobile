import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@services/firebase';
import app from '@services/firebase';

const storage = getStorage(app);

/**
 * Upload an image to Firebase Storage
 * @param uri - Local file URI
 * @param folder - Storage folder ('recipes' | 'avatars')
 * @returns Download URL of the uploaded image
 */
export const uploadImage = async (uri: string, folder: string): Promise<string> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }

    // Create a unique filename
    const timestamp = Date.now();
    
    const filename = folder === 'avatars' 
      ? `${folder}/${user.uid}/${timestamp}.jpg`
      : `${folder}/${timestamp}.jpg`;
    
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
    throw error; 
  }
};