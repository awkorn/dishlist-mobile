import { createClient } from '@supabase/supabase-js';
import { auth } from '@services/firebase';
import * as FileSystem from 'expo-file-system';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export const uploadImage = async (uri: string, folder: string): Promise<string> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated to upload images');
  }

  const timestamp = Date.now();
  const filename = folder === 'avatars'
    ? `${user.uid}/${timestamp}.jpg`
    : `${timestamp}.jpg`;

  // Use same approach as useImportRecipe
  const file = new FileSystem.File(uri);
  const base64 = await file.base64();

  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from(folder)
    .upload(filename, bytes.buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(folder)
    .getPublicUrl(filename);

  return data.publicUrl;
};