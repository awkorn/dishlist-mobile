import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { api } from '@services/api';
import { uploadImage } from '../image';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('@services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

describe('uploadImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes local images to JPEG before uploading', async () => {
    (manipulateAsync as jest.Mock).mockResolvedValueOnce({
      base64: 'normalized-jpeg-base64',
    });
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        publicUrl: 'https://example.supabase.co/storage/v1/object/public/recipes/photo.jpg',
      },
    });

    const publicUrl = await uploadImage('file:///local/photo.heic', 'recipes');

    expect(manipulateAsync).toHaveBeenCalledWith('file:///local/photo.heic', [], {
      base64: true,
      compress: 0.85,
      format: SaveFormat.JPEG,
    });
    expect(api.post).toHaveBeenCalledWith('/uploads/image', {
      base64: 'normalized-jpeg-base64',
      mimeType: 'image/jpeg',
      folder: 'recipes',
    });
    expect(publicUrl).toBe(
      'https://example.supabase.co/storage/v1/object/public/recipes/photo.jpg',
    );
  });

  it('fails before uploading when normalization does not return base64', async () => {
    (manipulateAsync as jest.Mock).mockResolvedValueOnce({});

    await expect(uploadImage('file:///local/photo.jpg', 'recipes')).rejects.toThrow(
      'Failed to prepare image for upload',
    );
    expect(api.post).not.toHaveBeenCalled();
  });
});
