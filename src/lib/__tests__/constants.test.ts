import { STORAGE_KEYS, STALE_TIMES, VALIDATION } from '../constants';

describe('constants', () => {
  describe('STORAGE_KEYS', () => {
    it('should have grocery list key', () => {
      expect(STORAGE_KEYS.GROCERY_LIST).toBe('grocery_list');
    });

    it('should have recipe progress prefix', () => {
      expect(STORAGE_KEYS.RECIPE_PROGRESS).toBe('recipe_progress_');
    });
  });

  describe('STALE_TIMES', () => {
    it('should have dishlist stale time of 5 minutes', () => {
      expect(STALE_TIMES.DISHLIST).toBe(5 * 60 * 1000);
    });

    it('should have shorter stale time for own dishlists', () => {
      expect(STALE_TIMES.DISHLIST_MY).toBeLessThan(STALE_TIMES.DISHLIST);
    });
  });

  describe('VALIDATION', () => {
    it('should require minimum 6 character password', () => {
      expect(VALIDATION.PASSWORD_MIN_LENGTH).toBe(6);
    });

    it('should limit title to 50 characters', () => {
      expect(VALIDATION.TITLE_MAX_LENGTH).toBe(50);
    });
  });
});