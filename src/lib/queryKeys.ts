export const queryKeys = {
  dishLists: {
    all: ['dishLists'] as const,
    lists: () => [...queryKeys.dishLists.all, 'list'] as const,
    list: (tab: string) => [...queryKeys.dishLists.lists(), tab] as const,
    detail: (id: string) => [...queryKeys.dishLists.all, 'detail', id] as const,
  },
  recipes: {
    all: ['recipes'] as const,
    lists: () => [...queryKeys.recipes.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.recipes.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.recipes.all, 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    profile: (id: string) => [...queryKeys.users.all, 'profile', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;