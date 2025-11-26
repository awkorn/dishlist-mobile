import AsyncStorage from '@react-native-async-storage/async-storage';
import { recipeProgressStorage } from '../services/recipeProgressStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('recipeProgressStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadProgress', () => {
    it('should load saved progress from storage', async () => {
      const savedProgress = {
        checkedIngredients: [0, 2],
        completedSteps: [1],
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(savedProgress));

      const result = await recipeProgressStorage.loadProgress('recipe-1');

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('recipe_progress_recipe-1');
      expect(result.checkedIngredients).toEqual(new Set([0, 2]));
      expect(result.completedSteps).toEqual(new Set([1]));
    });

    it('should return empty progress when nothing saved', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await recipeProgressStorage.loadProgress('recipe-1');

      expect(result.checkedIngredients).toEqual(new Set());
      expect(result.completedSteps).toEqual(new Set());
    });

    it('should return empty progress on error', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await recipeProgressStorage.loadProgress('recipe-1');

      expect(result.checkedIngredients).toEqual(new Set());
      expect(result.completedSteps).toEqual(new Set());
    });
  });

  describe('saveProgress', () => {
    it('should save progress to storage', async () => {
      const progress = {
        checkedIngredients: new Set([0, 1]),
        completedSteps: new Set([0]),
      };

      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      await recipeProgressStorage.saveProgress('recipe-1', progress);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'recipe_progress_recipe-1',
        JSON.stringify({
          checkedIngredients: [0, 1],
          completedSteps: [0],
        })
      );
    });

    it('should handle save errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      const progress = {
        checkedIngredients: new Set([0]),
        completedSteps: new Set<number>(),
      };

      // Should not throw
      await expect(
        recipeProgressStorage.saveProgress('recipe-1', progress)
      ).resolves.toBeUndefined();
    });
  });

  describe('clearProgress', () => {
    it('should remove progress from storage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValueOnce(undefined);

      await recipeProgressStorage.clearProgress('recipe-1');

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('recipe_progress_recipe-1');
    });

    it('should handle clear errors gracefully', async () => {
      mockAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw
      await expect(
        recipeProgressStorage.clearProgress('recipe-1')
      ).resolves.toBeUndefined();
    });
  });
});