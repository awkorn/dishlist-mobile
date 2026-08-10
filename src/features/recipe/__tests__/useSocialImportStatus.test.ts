import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";
import { queryKeys } from "@lib/queryKeys";
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
  recipeService: { getImportStatus: jest.fn() },
}));

jest.mock("@features/shareExtension/sharedStorage", () => ({
  readPendingImportIds: jest.fn(),
  removePendingImportId: jest.fn(),
}));

jest.mock("@components/ui/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockGetImportStatus = recipeService.getImportStatus as jest.Mock;
const mockReadPendingImportIds = readPendingImportIds as jest.Mock;
const mockRemovePendingImportId = removePendingImportId as jest.Mock;
const mockToastSuccess = toast.success as jest.Mock;
const mockToastError = toast.error as jest.Mock;

let currentAppState: "active" | "background" = "active";
let appStateListener: ((state: "active" | "background") => void) | undefined;

function status(
  importId: string,
  value: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
) {
  return {
    importId,
    status: value,
    errorCode: value === "FAILED" ? "INTERNAL" : null,
    errorMessage: value === "FAILED" ? "Couldn't import recipe" : null,
    recipeId: value === "COMPLETED" ? "recipe-1" : null,
    recipeTitle: value === "COMPLETED" ? "Garlic Noodles" : null,
    sourceUrl: "https://example.com/post",
    platform: "INSTAGRAM" as const,
    createdAt: "2026-08-10T12:00:00.000Z",
  };
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useSocialImportStatus banner presentation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    currentAppState = "active";
    appStateListener = undefined;
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      get: () => currentAppState,
    });
    jest.spyOn(AppState, "addEventListener").mockImplementation(
      (_type, listener) => {
        appStateListener = listener as typeof appStateListener;
        return { remove: jest.fn() };
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("silently reconciles terminal imports found when the app opens", async () => {
    mockReadPendingImportIds.mockReturnValue(["completed", "failed"]);
    mockGetImportStatus.mockImplementation((importId: string) =>
      Promise.resolve(
        status(importId, importId === "completed" ? "COMPLETED" : "FAILED")
      )
    );

    renderHook(() => useSocialImportStatus());
    await flushEffects();

    expect(mockRemovePendingImportId).toHaveBeenCalledWith("completed");
    expect(mockRemovePendingImportId).toHaveBeenCalledWith("failed");
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.recipes.all,
    });
  });

  it("shows a banner when an import completes while the app stays active", async () => {
    mockReadPendingImportIds.mockReturnValue(["import-1"]);
    mockGetImportStatus
      .mockResolvedValueOnce(status("import-1", "PROCESSING"))
      .mockResolvedValueOnce(status("import-1", "COMPLETED"));

    renderHook(() => useSocialImportStatus());
    await flushEffects();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      '"Garlic Noodles" was successfully added to My Recipes.',
      expect.objectContaining({ duration: 5000 })
    );
  });

  it("does not show a banner when an observed import finishes in the background", async () => {
    mockReadPendingImportIds.mockReturnValue(["import-1"]);
    mockGetImportStatus
      .mockResolvedValueOnce(status("import-1", "PROCESSING"))
      .mockResolvedValueOnce(status("import-1", "COMPLETED"));

    renderHook(() => useSocialImportStatus());
    await flushEffects();

    currentAppState = "background";
    act(() => appStateListener?.("background"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });

    expect(mockRemovePendingImportId).toHaveBeenCalledWith("import-1");
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
