import ActivityKit
import AppIntents
import Foundation

enum GroceryLiveActivityPaging {
  static let pageSize = 4
}

enum GroceryLiveActivitySharedStore {
  private static let suiteName = "group.com.dishlist.app"
  private static let checkedItemIdsKey = "groceryLiveActivity.checkedItemIds"

  static func recordCheckedItemId(_ itemId: String) {
    guard let defaults = UserDefaults(suiteName: suiteName) else { return }
    var itemIds = defaults.stringArray(forKey: checkedItemIdsKey) ?? []
    guard !itemIds.contains(itemId) else { return }
    itemIds.append(itemId)
    defaults.set(itemIds, forKey: checkedItemIdsKey)
  }

  static func consumeCheckedItemIds() -> [String] {
    guard let defaults = UserDefaults(suiteName: suiteName) else { return [] }
    let itemIds = defaults.stringArray(forKey: checkedItemIdsKey) ?? []
    defaults.removeObject(forKey: checkedItemIdsKey)
    return itemIds
  }

  static func clearCheckedItemIds() {
    UserDefaults(suiteName: suiteName)?.removeObject(forKey: checkedItemIdsKey)
  }
}

@available(iOS 17.0, *)
struct CheckGroceryItemIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Check grocery item"
  static var description = IntentDescription(
    "Marks an item complete in the active DishList grocery list."
  )

  @Parameter(title: "Item ID")
  var itemId: String

  init() {}

  init(itemId: String) {
    self.itemId = itemId
  }

  func perform() async throws -> some IntentResult {
    guard let activity = Activity<GroceryLiveActivityAttributes>.activities.first else {
      return .result()
    }

    let currentState = activity.content.state
    guard currentState.items.contains(where: { $0.id == itemId }) else {
      return .result()
    }

    let remainingItems = currentState.items.filter { $0.id != itemId }
    let remainingCount = max(currentState.remainingCount - 1, 0)
    let lastPage = remainingItems.isEmpty
      ? 0
      : (remainingItems.count - 1) / GroceryLiveActivityPaging.pageSize
    let nextState = GroceryLiveActivityAttributes.ContentState(
      items: remainingItems,
      remainingCount: remainingCount,
      pageIndex: min(currentState.pageIndex, lastPage),
      updatedAt: Date().timeIntervalSince1970
    )

    GroceryLiveActivitySharedStore.recordCheckedItemId(itemId)

    if remainingCount == 0 {
      await activity.end(using: nextState, dismissalPolicy: .default)
    } else {
      await activity.update(using: nextState)
    }

    return .result()
  }
}

@available(iOS 17.0, *)
struct ChangeGroceryPageIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Change grocery list page"
  static var description = IntentDescription(
    "Shows another page of the active DishList grocery list."
  )

  @Parameter(title: "Direction")
  var direction: Int

  init() {}

  init(direction: Int) {
    self.direction = direction
  }

  func perform() async throws -> some IntentResult {
    guard let activity = Activity<GroceryLiveActivityAttributes>.activities.first else {
      return .result()
    }

    let currentState = activity.content.state
    let lastPage = currentState.items.isEmpty
      ? 0
      : (currentState.items.count - 1) / GroceryLiveActivityPaging.pageSize
    let nextPage = min(max(currentState.pageIndex + direction, 0), lastPage)

    guard nextPage != currentState.pageIndex else {
      return .result()
    }

    await activity.update(
      using: GroceryLiveActivityAttributes.ContentState(
        items: currentState.items,
        remainingCount: currentState.remainingCount,
        pageIndex: nextPage,
        updatedAt: Date().timeIntervalSince1970
      )
    )

    return .result()
  }
}
