import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRecipeProgress } from '../hooks/useRecipeProgress';
import { recipeProgressStorage } from '../services/recipeProgressStorage';

jest.mock('../services/recipeProgressStorage', () => ({
  recipeProgressStorage: {
    loadProgress: jest.fn(),
    saveProgress: jest.fn(),
    clearProgress: jest.fn(),
  },
}));

const mockStorage = recipeProgressStorage as jest.Mocked<typeof recipeProgressStorage>;

describe('useRecipeProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.loadProgress.mockResolvedValue({
      checkedIngredients: new Set(),
      completedSteps: new Set(),
    });
    mockStorage.saveProgress.mockResolvedValue(undefined);
    mockStorage.clearProgress.mockResolvedValue(undefined);
  });

  it('should load progress on mount', async () => {
    const savedProgress = {
      checkedIngredients: new Set([0, 1]),
      completedSteps: new Set([0]),
    };
    mockStorage.loadProgress.mockResolvedValueOnce(savedProgress);

    const { result } = renderHook(() => useRecipeProgress({ recipeId: 'recipe-1' }));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(mockStorage.loadProgress).toHaveBeenCalledWith('recipe-1');
    expect(result.current.progress.checkedIngredients).toEqual(new Set([0, 1]));
    expect(result.current.progress.completedSteps).toEqual(new Set([0]));
  });

  it('should toggle ingredient and save', async () => {
    const { result } = renderHook(() => useRecipeProgress({ recipeId: 'recipe-1' }));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.toggleIngredient(0);
    });

    expect(result.current.progress.checkedIngredients.has(0)).toBe(true);
    expect(mockStorage.saveProgress).toHaveBeenCalled();

    // Toggle off
    act(() => {
      result.current.toggleIngredient(0);
    });

    expect(result.current.progress.checkedIngredients.has(0)).toBe(false);
  });

  it('should toggle step and save', async () => {
    const { result } = renderHook(() => useRecipeProgress({ recipeId: 'recipe-1' }));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.toggleStep(0);
    });

    expect(result.current.progress.completedSteps.has(0)).toBe(true);
    expect(mockStorage.saveProgress).toHaveBeenCalled();
  });

  it('should reset progress', async () => {
    mockStorage.loadProgress.mockResolvedValueOnce({
      checkedIngredients: new Set([0, 1]),
      completedSteps: new Set([0]),
    });

    const { result } = renderHook(() => useRecipeProgress({ recipeId: 'recipe-1' }));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.progress.checkedIngredients.size).toBe(0);
    expect(result.current.progress.completedSteps.size).toBe(0);
    expect(mockStorage.clearProgress).toHaveBeenCalledWith('recipe-1');
  });
});