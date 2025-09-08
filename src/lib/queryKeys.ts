export const queryKeys = {
  dishLists: {
    all: ['dishLists'] as const,
    lists: () => [...queryKeys.dishLists.all, 'list'] as const,
    list: (tab: string) => [...queryKeys.dishLists.lists(), tab] as const,
    infinite: (tab: string) => [...queryKeys.dishLists.list(tab), 'infinite'] as const,
  },
  recipes: {
    all: ['recipes'] as const,
    lists: () => [...queryKeys.recipes.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.recipes.lists(), filters] as const,
    details: () => [...queryKeys.recipes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.recipes.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    profile: (id: string) => [...queryKeys.users.all, 'profile', id] as const,
  },
} as const;