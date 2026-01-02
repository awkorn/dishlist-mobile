import { api } from "@services/api";
import type { SearchTab, SearchResponse } from "../types";

export interface SearchParams {
  query: string;
  tab: SearchTab;
  cursor?: string;
  limit?: number;
}

export const searchService = {
  /**
   * Search for users, recipes, and DishLists
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const { query, tab, cursor, limit = 20 } = params;

    const searchParams = new URLSearchParams({
      q: query,
      tab,
      limit: limit.toString(),
    });

    if (cursor) {
      searchParams.append("cursor", cursor);
    }

    const response = await api.get<SearchResponse>(
      `/search?${searchParams.toString()}`
    );

    return response.data;
  },
};