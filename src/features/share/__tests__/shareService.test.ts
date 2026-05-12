import { shareService } from '../services/shareService';

describe('shareService', () => {
  describe('share links', () => {
    it('generates deep links for shareable content', () => {
      expect(shareService.generateDishListLink('dishlist-123')).toBe(
        'dishlist://dishlist/dishlist-123',
      );
      expect(shareService.generateRecipeLink('recipe-123')).toBe(
        'dishlist://recipe/recipe-123',
      );
      expect(shareService.generateProfileLink('user-123')).toBe(
        'dishlist://profile/user-123',
      );
    });
  });
});
