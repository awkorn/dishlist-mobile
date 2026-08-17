import { act, renderHook } from "@testing-library/react-native";
import { toast } from "@components/ui/toast";
import { useSocialImportStatus } from "../hooks/useSocialImportStatus";
import { recipeService } from "../services/recipeService";
import { removePendingImportId } from "@features/shareExtension/sharedStorage";

const mockNavigate = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: "denied" })),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));
jest.mock("@providers/AuthProvider/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));
jest.mock("../services/recipeService", () => ({
  recipeService: {
    getSocialImports: jest.fn(),
    markImportPresented: jest.fn(async () => undefined),
    startSocialImport: jest.fn(),
  },
}));
jest.mock("@features/shareExtension/sharedStorage", () => ({
  appendPendingImportId: jest.fn(),
  clearPendingSharedUrl: jest.fn(),
  readPendingImportIds: jest.fn(() => []),
  readPendingSharedImages: jest.fn(() => null),
  readPendingSharedUrl: jest.fn(() => null),
  removePendingImportId: jest.fn(),
}));
jest.mock("@components/ui/toast", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const completed = {
  importId: "completed",
  status: "COMPLETED" as const,
  phase: "COMPLETED",
  attempt: 1,
  errorCode: null,
  errorMessage: null,
  recipeId: "recipe-1",
  recipeTitle: "Garlic Noodles",
  warnings: [],
  confidence: 1,
  extractionSource: "caption",
  sourceUrl: "https://instagram.com/p/1",
  platform: "INSTAGRAM" as const,
  createdAt: "2026-08-10T12:00:00.000Z",
  updatedAt: "2026-08-10T12:01:00.000Z",
  presentedAt: null,
  alreadySaved: true,
};

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useSocialImportStatus server reconciliation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("presents an unpresented completion even when no local id survived", async () => {
    (recipeService.getSocialImports as jest.Mock).mockResolvedValue([completed]);
    const { unmount } = renderHook(() => useSocialImportStatus());
    await flushEffects();

    expect(removePendingImportId).toHaveBeenCalledWith("completed");
    expect(toast.success).toHaveBeenCalledWith(
      "“Garlic Noodles” was added to My Recipes.",
      expect.objectContaining({ duration: 5000 })
    );
    expect(recipeService.markImportPresented).toHaveBeenCalledWith("completed");
    unmount();
  });

  it("keeps failed imports actionable when push is unavailable", async () => {
    (recipeService.getSocialImports as jest.Mock).mockResolvedValue([
      {
        ...completed,
        importId: "failed",
        status: "FAILED",
        recipeId: null,
        recipeTitle: null,
        errorMessage: "That post is private.",
      },
    ]);
    const { unmount } = renderHook(() => useSocialImportStatus());
    await flushEffects();

    expect(toast.error).toHaveBeenCalledWith(
      "That post is private.",
      expect.objectContaining({ duration: 5500 })
    );
    expect(recipeService.markImportPresented).toHaveBeenCalledWith("failed");
    unmount();
  });
});
