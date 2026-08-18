import { act, renderHook } from "@testing-library/react-native";
import { toast } from "@components/ui/toast";
import { useSocialImportStatus } from "../hooks/useSocialImportStatus";
import { recipeService } from "../services/recipeService";
import {
  readPendingImportIds,
  removePendingImportId,
} from "@features/shareExtension/sharedStorage";

const mockNavigate = jest.fn();
const mockInvalidateQueries = jest.fn();

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
    getImportStatus: jest.fn(),
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
    (readPendingImportIds as jest.Mock).mockReturnValue([]);
  });

  it("settles a completed import through notifications without replaying a toast", async () => {
    (readPendingImportIds as jest.Mock)
      .mockReturnValueOnce(["completed"])
      .mockReturnValue([]);
    (recipeService.getImportStatus as jest.Mock).mockResolvedValue(completed);
    const { unmount } = renderHook(() => useSocialImportStatus());
    await flushEffects();

    expect(removePendingImportId).toHaveBeenCalledWith("completed");
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["notifications"] })
    );
    unmount();
  });

  it("records failed imports in notifications without replaying an error toast", async () => {
    (readPendingImportIds as jest.Mock)
      .mockReturnValueOnce(["failed"])
      .mockReturnValue([]);
    (recipeService.getImportStatus as jest.Mock).mockResolvedValue({
      ...completed,
      importId: "failed",
      status: "FAILED",
      recipeId: null,
      recipeTitle: null,
      errorMessage: "That post is private.",
    });
    const { unmount } = renderHook(() => useSocialImportStatus());
    await flushEffects();

    expect(removePendingImportId).toHaveBeenCalledWith("failed");
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["notifications"] })
    );
    unmount();
  });
});
