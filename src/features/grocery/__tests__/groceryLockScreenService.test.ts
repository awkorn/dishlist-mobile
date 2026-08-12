import DishListLiveActivity from "@modules/dishlist-live-activity";
import {
  buildGroceryLockScreenPayload,
  groceryLockScreenService,
} from "../services/groceryLockScreenService";
import type { GroceryItem } from "../types";

jest.mock("@modules/dishlist-live-activity", () => ({
  __esModule: true,
  default: {
    getStatus: jest.fn(),
    start: jest.fn(),
    update: jest.fn(),
    end: jest.fn(),
    consumeCheckedItemIds: jest.fn(),
  },
}));

const nativeModule = DishListLiveActivity as jest.Mocked<
  NonNullable<typeof DishListLiveActivity>
>;

const makeItem = (
  id: string,
  text: string,
  checked = false
): GroceryItem => ({ id, text, checked, addedAt: Number(id) });

describe("groceryLockScreenService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a compact payload while preserving the total remaining count", () => {
    const items = [
      makeItem("1", "  Whole   milk  "),
      makeItem("2", "Already bought", true),
      makeItem("3", "Bread"),
      makeItem("4", "Eggs"),
      makeItem("5", "Apples"),
      makeItem("6", "Coffee"),
      makeItem("7", "Hidden overflow item"),
    ];

    expect(buildGroceryLockScreenPayload(items)).toEqual({
      items: [
        { id: "1", text: "Whole milk" },
        { id: "3", text: "Bread" },
        { id: "4", text: "Eggs" },
        { id: "5", text: "Apples" },
        { id: "6", text: "Coffee" },
        { id: "7", text: "Hidden overflow item" },
      ],
      remainingCount: 6,
    });
  });

  it("starts the Live Activity with unchecked items", async () => {
    nativeModule.start.mockResolvedValue("activity-id");
    const items = [makeItem("1", "Milk"), makeItem("2", "Bread", true)];

    await expect(groceryLockScreenService.start(items)).resolves.toBe(
      "activity-id"
    );
    expect(nativeModule.start).toHaveBeenCalledWith(["1"], ["Milk"], 1);
  });

  it("syncs list changes into an existing Live Activity", async () => {
    nativeModule.update.mockResolvedValue(true);

    await expect(
      groceryLockScreenService.sync([
        makeItem("1", "Milk"),
        makeItem("2", "Bread"),
      ])
    ).resolves.toBe(true);
    expect(nativeModule.update).toHaveBeenCalledWith(
      ["1", "2"],
      ["Milk", "Bread"],
      2
    );
  });

  it("ends an active Live Activity when every item is complete", async () => {
    nativeModule.getStatus.mockResolvedValue({
      isSupported: true,
      areActivitiesEnabled: true,
      isActive: true,
    });

    await expect(
      groceryLockScreenService.sync([makeItem("1", "Milk", true)])
    ).resolves.toBe(true);
    expect(nativeModule.end).toHaveBeenCalledWith([], [], 0, false);
    expect(nativeModule.update).not.toHaveBeenCalled();
  });

  it("keeps completed items visible when the user explicitly ends Shopping Mode", async () => {
    await groceryLockScreenService.end([
      makeItem("1", "Milk", true),
      makeItem("2", "Bread"),
    ]);

    expect(nativeModule.end).toHaveBeenCalledWith(
      ["2"],
      ["Bread"],
      1,
      true
    );
  });

  it("consumes item checks performed from the Lock Screen", async () => {
    nativeModule.consumeCheckedItemIds.mockResolvedValue(["1", "2"]);

    await expect(
      groceryLockScreenService.consumeCheckedItemIds()
    ).resolves.toEqual(["1", "2"]);
  });
});
