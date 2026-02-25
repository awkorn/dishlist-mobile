import { createClient } from '@supabase/supabase-js';
import { auth } from '@services/firebase';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Upload an image to Supabase Storage
 * @param uri - Local file URI
 * @param folder - Storage bucket ('recipes' | 'avatars')
 * @returns Public URL of the uploaded image
 */
export const uploadImage = async (uri: string, folder: string): Promise<string> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated to upload images');
  }

  const timestamp = Date.now();
  const filename = folder === 'avatars'
    ? `${user.uid}/${timestamp}.jpg`
    : `${timestamp}.jpg`;

  // Convert URI to blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // Upload to Supabase
  const { error } = await supabase.storage
    .from(folder)
    .upload(filename, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(error.message);
  }

  // Get public URL
  const { data } = supabase.storage
    .from(folder)
    .getPublicUrl(filename);

  return data.publicUrl;
};