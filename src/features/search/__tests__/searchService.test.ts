import { searchService } from "../services/searchService";
import { api } from "@services/api";

jest.mock("@services/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const emptyResponse = {
  users: [],
  recipes: [],
  dishLists: [],
  nextCursor: null,
};

describe("searchService.search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue({ data: emptyResponse } as any);
  });

  it("builds the query string with q, tab and limit", async () => {
    await searchService.search({ query: "pasta", tab: "recipes", limit: 20 });

    expect(mockApi.get).toHaveBeenCalledTimes(1);
    const url = mockApi.get.mock.calls[0][0] as string;
    expect(url).toContain("/search?");
    expect(url).toContain("q=pasta");
    expect(url).toContain("tab=recipes");
    expect(url).toContain("limit=20");
    expect(url).not.toContain("cursor=");
  });

  it("appends the cursor when provided", async () => {
    await searchService.search({
      query: "pasta",
      tab: "recipes",
      cursor: "recipe-42",
      limit: 20,
    });

    const url = mockApi.get.mock.calls[0][0] as string;
    expect(url).toContain("cursor=recipe-42");
  });

  it("url-encodes special characters in the query", async () => {
    await searchService.search({ query: "mac & cheese", tab: "all" });

    const url = mockApi.get.mock.calls[0][0] as string;
    // "&" and space must be encoded so they don't break the query string
    expect(url).toContain("q=mac+%26+cheese");
  });

  it("defaults the limit to 20 when omitted", async () => {
    await searchService.search({ query: "pasta", tab: "all" });

    const url = mockApi.get.mock.calls[0][0] as string;
    expect(url).toContain("limit=20");
  });

  it("returns the response payload", async () => {
    const result = await searchService.search({ query: "pasta", tab: "all" });
    expect(result).toEqual(emptyResponse);
  });
});
