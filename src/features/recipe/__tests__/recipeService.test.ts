import { recipeService } from '../services/recipeService';
import { api } from '@services/api';

jest.mock('@services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('recipeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecipe', () => {
    it('should fetch a recipe by ID', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        title: 'Test Recipe',
        ingredients: ['ingredient 1'],
        instructions: ['step 1'],
        creatorId: 'user-1',
        creator: { uid: 'user-1', username: 'testuser' },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockApi.get.mockResolvedValueOnce({ data: { recipe: mockRecipe } });

      const result = await recipeService.getRecipe('recipe-1');

      expect(mockApi.get).toHaveBeenCalledWith('/recipes/recipe-1');
      expect(result).toEqual(mockRecipe);
    });

    it('should throw error when fetch fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(recipeService.getRecipe('recipe-1')).rejects.toThrow('Network error');
    });
  });

  describe('createRecipe', () => {
    it('should create a new recipe', async () => {
      const createData = {
        title: 'New Recipe',
        ingredients: ['flour', 'sugar'],
        instructions: ['mix', 'bake'],
        dishListId: 'dishlist-1',
      };

      const mockRecipe = {
        id: 'recipe-new',
        ...createData,
        creatorId: 'user-1',
        creator: { uid: 'user-1' },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockApi.post.mockResolvedValueOnce({ data: { recipe: mockRecipe } });

      const result = await recipeService.createRecipe(createData);

      expect(mockApi.post).toHaveBeenCalledWith('/recipes', createData);
      expect(result).toEqual(mockRecipe);
    });
  });

  describe('updateRecipe', () => {
    it('should update an existing recipe', async () => {
      const updateData = {
        title: 'Updated Recipe',
        ingredients: ['new ingredient'],
        instructions: ['new step'],
      };

      const mockRecipe = {
        id: 'recipe-1',
        ...updateData,
        creatorId: 'user-1',
        creator: { uid: 'user-1' },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };

      mockApi.put.mockResolvedValueOnce({ data: { recipe: mockRecipe } });

      const result = await recipeService.updateRecipe('recipe-1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/recipes/recipe-1', updateData);
      expect(result).toEqual(mockRecipe);
    });
  });

  describe('addRecipeToDishList', () => {
    it('should add a recipe to a dishlist', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await recipeService.addRecipeToDishList('dishlist-1', 'recipe-1');

      expect(mockApi.post).toHaveBeenCalledWith('/dishlists/dishlist-1/recipes', {
        recipeId: 'recipe-1',
      });
    });
  });

  describe('getRecipeDishLists', () => {
    it('should fetch dishlists containing a recipe', async () => {
      const mockDishListIds = ['dishlist-1', 'dishlist-2'];

      mockApi.get.mockResolvedValueOnce({ data: { dishListIds: mockDishListIds } });

      const result = await recipeService.getRecipeDishLists('recipe-1');

      expect(mockApi.get).toHaveBeenCalledWith('/recipes/recipe-1/dishlists');
      expect(result).toEqual(mockDishListIds);
    });
  });
});