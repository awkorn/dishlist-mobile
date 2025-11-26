import { dishlistService } from '../services/dishListService';
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

describe('dishlistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDishLists', () => {
    it('should fetch dishlists with default tab', async () => {
      const mockDishLists = [
        { id: '1', title: 'My Recipes', recipeCount: 5 },
        { id: '2', title: 'Family Recipes', recipeCount: 3 },
      ];
      mockApi.get.mockResolvedValueOnce({ data: { dishLists: mockDishLists } });

      const result = await dishlistService.getDishLists();

      expect(mockApi.get).toHaveBeenCalledWith('/dishlists?tab=all');
      expect(result).toEqual(mockDishLists);
    });

    it('should fetch dishlists with specific tab', async () => {
      const mockDishLists = [{ id: '1', title: 'My Recipes' }];
      mockApi.get.mockResolvedValueOnce({ data: { dishLists: mockDishLists } });

      const result = await dishlistService.getDishLists('my');

      expect(mockApi.get).toHaveBeenCalledWith('/dishlists?tab=my');
      expect(result).toEqual(mockDishLists);
    });
  });

  describe('getDishListDetail', () => {
    it('should fetch dishlist detail by id', async () => {
      const mockDetail = {
        id: '1',
        title: 'My Recipes',
        recipes: [],
        followerCount: 10,
      };
      mockApi.get.mockResolvedValueOnce({ data: { dishList: mockDetail } });

      const result = await dishlistService.getDishListDetail('1');

      expect(mockApi.get).toHaveBeenCalledWith('/dishlists/1');
      expect(result).toEqual(mockDetail);
    });
  });

  describe('createDishList', () => {
    it('should create a new dishlist', async () => {
      const newDishList = { title: 'New List', visibility: 'PUBLIC' as const };
      const mockResponse = { id: '3', ...newDishList };
      mockApi.post.mockResolvedValueOnce({ data: { dishList: mockResponse } });

      const result = await dishlistService.createDishList(newDishList);

      expect(mockApi.post).toHaveBeenCalledWith('/dishlists', newDishList);
      expect(result).toEqual(mockResponse);
    });

    it('should create dishlist with description', async () => {
      const newDishList = {
        title: 'New List',
        description: 'A description',
        visibility: 'PRIVATE' as const,
      };
      const mockResponse = { id: '3', ...newDishList };
      mockApi.post.mockResolvedValueOnce({ data: { dishList: mockResponse } });

      const result = await dishlistService.createDishList(newDishList);

      expect(mockApi.post).toHaveBeenCalledWith('/dishlists', newDishList);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateDishList', () => {
    it('should update an existing dishlist', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        visibility: 'PRIVATE' as const,
      };
      const mockResponse = { id: '1', ...updateData };
      mockApi.put.mockResolvedValueOnce({ data: { dishList: mockResponse } });

      const result = await dishlistService.updateDishList('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/dishlists/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteDishList', () => {
    it('should delete a dishlist', async () => {
      mockApi.delete.mockResolvedValueOnce({});

      await dishlistService.deleteDishList('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/dishlists/1');
    });
  });

  describe('pinDishList', () => {
    it('should pin a dishlist', async () => {
      mockApi.post.mockResolvedValueOnce({});

      await dishlistService.pinDishList('1');

      expect(mockApi.post).toHaveBeenCalledWith('/dishlists/1/pin');
    });
  });

  describe('unpinDishList', () => {
    it('should unpin a dishlist', async () => {
      mockApi.delete.mockResolvedValueOnce({});

      await dishlistService.unpinDishList('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/dishlists/1/pin');
    });
  });

  describe('followDishList', () => {
    it('should follow a dishlist', async () => {
      mockApi.post.mockResolvedValueOnce({});

      await dishlistService.followDishList('1');

      expect(mockApi.post).toHaveBeenCalledWith('/dishlists/1/follow');
    });
  });

  describe('unfollowDishList', () => {
    it('should unfollow a dishlist', async () => {
      mockApi.delete.mockResolvedValueOnce({});

      await dishlistService.unfollowDishList('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/dishlists/1/follow');
    });
  });

  describe('removeRecipeFromDishList', () => {
    it('should remove a recipe from a dishlist', async () => {
      mockApi.delete.mockResolvedValueOnce({});

      await dishlistService.removeRecipeFromDishList('dish-1', 'recipe-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/dishlists/dish-1/recipes/recipe-1');
    });
  });
});