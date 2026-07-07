import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { api } from '@services/api';

async function normalizeImageForUpload(uri: string) {
  const result = await manipulateAsync(uri, [], {
    base64: true,
    compress: 0.85,
    format: SaveFormat.JPEG,
  });

  if (!result.base64) {
    throw new Error('Failed to prepare image for upload');
  }

  return result.base64;
}

export const uploadImage = async (uri: string, folder: string): Promise<string> => {
  const base64 = await normalizeImageForUpload(uri);

  const { data } = await api.post<{ publicUrl: string }>('/uploads/image', {
    base64,
    mimeType: 'image/jpeg',
    folder,
  });

  return data.publicUrl;
};
