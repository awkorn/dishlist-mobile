import {
  parseNotificationData,
  isActionableNotification,
  isNavigableNotification,
} from '../types';
import type {
  NotificationType,
  DishListInvitationData,
  RecipeSharedData,
  DishListSharedData,
  RecipeAddedData,
} from '../types';

describe('parseNotificationData', () => {
  describe('successful parsing', () => {
    it('parses DishListInvitationData correctly', () => {
      const jsonString = JSON.stringify({
        dishListId: 'dl-123',
        dishListTitle: 'Summer Recipes',
        senderId: 'user-2',
        senderName: 'Bob',
      });

      const result = parseNotificationData<DishListInvitationData>(jsonString);

      expect(result).toEqual({
        dishListId: 'dl-123',
        dishListTitle: 'Summer Recipes',
        senderId: 'user-2',
        senderName: 'Bob',
      });
    });

    it('parses RecipeSharedData correctly', () => {
      const jsonString = JSON.stringify({
        recipeId: 'r-456',
        recipeTitle: 'Pasta Carbonara',
        senderId: 'user-3',
        senderName: 'Jane',
      });

      const result = parseNotificationData<RecipeSharedData>(jsonString);

      expect(result).toEqual({
        recipeId: 'r-456',
        recipeTitle: 'Pasta Carbonara',
        senderId: 'user-3',
        senderName: 'Jane',
      });
    });

    it('parses DishListSharedData correctly', () => {
      const jsonString = JSON.stringify({
        dishListId: 'dl-789',
        dishListTitle: 'Holiday Meals',
        senderId: 'user-4',
        senderName: 'Alice',
      });

      const result = parseNotificationData<DishListSharedData>(jsonString);

      expect(result).toEqual({
        dishListId: 'dl-789',
        dishListTitle: 'Holiday Meals',
        senderId: 'user-4',
        senderName: 'Alice',
      });
    });

    it('parses RecipeAddedData correctly', () => {
      const jsonString = JSON.stringify({
        recipeId: 'r-101',
        recipeTitle: 'Chocolate Cake',
        dishListId: 'dl-202',
        dishListTitle: 'Desserts',
        addedById: 'user-5',
        addedByName: 'Charlie',
      });

      const result = parseNotificationData<RecipeAddedData>(jsonString);

      expect(result).toEqual({
        recipeId: 'r-101',
        recipeTitle: 'Chocolate Cake',
        dishListId: 'dl-202',
        dishListTitle: 'Desserts',
        addedById: 'user-5',
        addedByName: 'Charlie',
      });
    });
  });

  describe('null handling', () => {
    it('returns null for null input', () => {
      const result = parseNotificationData<RecipeSharedData>(null);

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('returns null for invalid JSON', () => {
      const result = parseNotificationData<RecipeSharedData>('not valid json');

      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = parseNotificationData<RecipeSharedData>('');

      expect(result).toBeNull();
    });

    it('returns null for malformed JSON', () => {
      const result = parseNotificationData<RecipeSharedData>('{ dishListId: "test"');

      expect(result).toBeNull();
    });

    it('handles JSON with missing fields (returns partial data)', () => {
      const jsonString = JSON.stringify({
        recipeId: 'r-123',
        // missing recipeTitle, senderId, senderName
      });

      const result = parseNotificationData<RecipeSharedData>(jsonString);

      expect(result).toEqual({
        recipeId: 'r-123',
      });
    });
  });

  describe('edge cases', () => {
    it('parses empty object', () => {
      const result = parseNotificationData<RecipeSharedData>('{}');

      expect(result).toEqual({});
    });

    it('preserves extra fields in parsed data', () => {
      const jsonString = JSON.stringify({
        recipeId: 'r-123',
        recipeTitle: 'Test',
        senderId: 'user-1',
        senderName: 'Test User',
        extraField: 'should be preserved',
      });

      const result = parseNotificationData<RecipeSharedData>(jsonString);

      expect(result).toHaveProperty('extraField', 'should be preserved');
    });
  });
});

describe('isActionableNotification', () => {
  it('returns true for DISHLIST_INVITATION', () => {
    expect(isActionableNotification('DISHLIST_INVITATION')).toBe(true);
  });

  it('returns false for DISHLIST_SHARED', () => {
    expect(isActionableNotification('DISHLIST_SHARED')).toBe(false);
  });

  it('returns false for RECIPE_SHARED', () => {
    expect(isActionableNotification('RECIPE_SHARED')).toBe(false);
  });

  it('returns false for RECIPE_ADDED', () => {
    expect(isActionableNotification('RECIPE_ADDED')).toBe(false);
  });

  it('returns false for DISHLIST_FOLLOWED', () => {
    expect(isActionableNotification('DISHLIST_FOLLOWED')).toBe(false);
  });

  it('returns false for COLLABORATION_ACCEPTED', () => {
    expect(isActionableNotification('COLLABORATION_ACCEPTED')).toBe(false);
  });

  it('returns false for COLLABORATION_DECLINED', () => {
    expect(isActionableNotification('COLLABORATION_DECLINED')).toBe(false);
  });

  it('returns false for USER_FOLLOWED', () => {
    expect(isActionableNotification('USER_FOLLOWED')).toBe(false);
  });

  it('returns false for SYSTEM_UPDATE', () => {
    expect(isActionableNotification('SYSTEM_UPDATE')).toBe(false);
  });
});

describe('isNavigableNotification', () => {
  describe('navigable types', () => {
    it('returns true for DISHLIST_SHARED', () => {
      expect(isNavigableNotification('DISHLIST_SHARED')).toBe(true);
    });

    it('returns true for RECIPE_SHARED', () => {
      expect(isNavigableNotification('RECIPE_SHARED')).toBe(true);
    });

    it('returns true for RECIPE_ADDED', () => {
      expect(isNavigableNotification('RECIPE_ADDED')).toBe(true);
    });
  });

  describe('non-navigable types', () => {
    it('returns false for DISHLIST_INVITATION', () => {
      expect(isNavigableNotification('DISHLIST_INVITATION')).toBe(false);
    });

    it('returns false for DISHLIST_FOLLOWED', () => {
      expect(isNavigableNotification('DISHLIST_FOLLOWED')).toBe(false);
    });

    it('returns false for COLLABORATION_ACCEPTED', () => {
      expect(isNavigableNotification('COLLABORATION_ACCEPTED')).toBe(false);
    });

    it('returns false for COLLABORATION_DECLINED', () => {
      expect(isNavigableNotification('COLLABORATION_DECLINED')).toBe(false);
    });

    it('returns false for USER_FOLLOWED', () => {
      expect(isNavigableNotification('USER_FOLLOWED')).toBe(false);
    });

    it('returns false for SYSTEM_UPDATE', () => {
      expect(isNavigableNotification('SYSTEM_UPDATE')).toBe(false);
    });
  });
});

describe('NotificationType coverage', () => {
  const allNotificationTypes: NotificationType[] = [
    'DISHLIST_INVITATION',
    'DISHLIST_SHARED',
    'RECIPE_SHARED',
    'RECIPE_ADDED',
    'DISHLIST_FOLLOWED',
    'COLLABORATION_ACCEPTED',
    'COLLABORATION_DECLINED',
    'USER_FOLLOWED',
    'SYSTEM_UPDATE',
  ];

  it('all notification types are handled by isActionableNotification', () => {
    allNotificationTypes.forEach((type) => {
      expect(() => isActionableNotification(type)).not.toThrow();
    });
  });

  it('all notification types are handled by isNavigableNotification', () => {
    allNotificationTypes.forEach((type) => {
      expect(() => isNavigableNotification(type)).not.toThrow();
    });
  });

  it('only DISHLIST_INVITATION is actionable', () => {
    const actionable = allNotificationTypes.filter(isActionableNotification);
    expect(actionable).toEqual(['DISHLIST_INVITATION']);
  });

  it('only DISHLIST_SHARED, RECIPE_SHARED, RECIPE_ADDED are navigable', () => {
    const navigable = allNotificationTypes.filter(isNavigableNotification);
    expect(navigable.sort()).toEqual(['DISHLIST_SHARED', 'RECIPE_ADDED', 'RECIPE_SHARED'].sort());
  });

  it('actionable and navigable are mutually exclusive', () => {
    const actionable = allNotificationTypes.filter(isActionableNotification);
    const navigable = allNotificationTypes.filter(isNavigableNotification);
    
    const overlap = actionable.filter((type) => navigable.includes(type));
    expect(overlap).toEqual([]);
  });
});