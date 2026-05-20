import * as FileSystem from 'expo-file-system';
import { api } from '@services/api';

function getMimeType(uri: string) {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export const uploadImage = async (uri: string, folder: string): Promise<string> => {
  const file = new FileSystem.File(uri);
  const base64 = await file.base64();

  const { data } = await api.post<{ publicUrl: string }>('/uploads/image', {
    base64,
    mimeType: getMimeType(uri),
    folder,
  });

  return data.publicUrl;
};
