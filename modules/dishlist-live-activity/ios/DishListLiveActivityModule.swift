import ActivityKit
import ExpoModulesCore
import Foundation

public final class DishListLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DishListLiveActivity")

    AsyncFunction("getStatus") { () -> [String: Any] in
      guard #available(iOS 16.1, *) else {
        return Self.status(
          isSupported: false,
          areActivitiesEnabled: false,
          activityId: nil
        )
      }

      let activitiesEnabled = ActivityAuthorizationInfo().areActivitiesEnabled
      let activity = Activity<GroceryLiveActivityAttributes>.activities.first

      return Self.status(
        isSupported: true,
        areActivitiesEnabled: activitiesEnabled,
        activityId: activity?.id
      )
    }

    AsyncFunction("start") {
      (
        itemIds: [String],
        itemTexts: [String],
        remainingCount: Int,
        promise: Promise
      ) in
      guard #available(iOS 16.1, *) else {
        promise.reject(
          "ERR_LIVE_ACTIVITY_UNSUPPORTED",
          "Grocery Live Activities require iOS 16.1 or later"
        )
        return
      }

      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        promise.reject(
          "ERR_LIVE_ACTIVITY_DISABLED",
          "Live Activities are disabled for DishList"
        )
        return
      }

      guard remainingCount > 0 else {
        promise.reject(
          "ERR_EMPTY_GROCERY_LIST",
          "At least one unchecked grocery item is required"
        )
        return
      }

      Task {
        do {
          await Self.endAllActivities(
            finalState: Self.makeState(
              itemIds: [],
              itemTexts: [],
              remainingCount: 0
            ),
            dismissalPolicy: .immediate
          )
          GroceryLiveActivitySharedStore.clearCheckedItemIds()

          let activity = try Activity<GroceryLiveActivityAttributes>.request(
            attributes: GroceryLiveActivityAttributes(
              startedAt: Date().timeIntervalSince1970
            ),
            contentState: Self.makeState(
              itemIds: itemIds,
              itemTexts: itemTexts,
              remainingCount: remainingCount
            ),
            pushType: nil
          )
          promise.resolve(activity.id)
        } catch {
          promise.reject(
            "ERR_LIVE_ACTIVITY_START",
            "Unable to start the grocery Live Activity: \(error.localizedDescription)"
          )
        }
      }
    }

    AsyncFunction("update") {
      (
        itemIds: [String],
        itemTexts: [String],
        remainingCount: Int,
        promise: Promise
      ) in
      guard #available(iOS 16.1, *) else {
        promise.resolve(false)
        return
      }

      guard let activity = Activity<GroceryLiveActivityAttributes>.activities.first else {
        promise.resolve(false)
        return
      }

      let pageIndex: Int
      if #available(iOS 16.2, *) {
        pageIndex = activity.content.state.pageIndex
      } else {
        pageIndex = 0
      }

      let state = Self.makeState(
        itemIds: itemIds,
        itemTexts: itemTexts,
        remainingCount: remainingCount,
        pageIndex: pageIndex
      )
      Task {
        await activity.update(using: state)
        promise.resolve(true)
      }
    }

    AsyncFunction("end") {
      (
        itemIds: [String],
        itemTexts: [String],
        remainingCount: Int,
        dismissImmediately: Bool,
        promise: Promise
      ) in
      guard #available(iOS 16.1, *) else {
        promise.resolve()
        return
      }

      Task {
        await Self.endAllActivities(
          finalState: Self.makeState(
            itemIds: itemIds,
            itemTexts: itemTexts,
            remainingCount: remainingCount
          ),
          dismissalPolicy: dismissImmediately ? .immediate : .default
        )
        promise.resolve()
      }
    }

    AsyncFunction("consumeCheckedItemIds") { () -> [String] in
      GroceryLiveActivitySharedStore.consumeCheckedItemIds()
    }
  }

  private static func status(
    isSupported: Bool,
    areActivitiesEnabled: Bool,
    activityId: String?
  ) -> [String: Any] {
    var result: [String: Any] = [
      "isSupported": isSupported,
      "areActivitiesEnabled": areActivitiesEnabled,
      "isActive": activityId != nil,
    ]

    if let activityId {
      result["activityId"] = activityId
    }

    return result
  }

  @available(iOS 16.1, *)
  private static func makeState(
    itemIds: [String],
    itemTexts: [String],
    remainingCount: Int,
    pageIndex: Int = 0
  ) -> GroceryLiveActivityAttributes.ContentState {
    let itemCount = min(itemIds.count, itemTexts.count)
    let items = (0..<itemCount).map { index in
      GroceryLiveActivityItem(id: itemIds[index], text: itemTexts[index])
    }

    return GroceryLiveActivityAttributes.ContentState(
      items: items,
      remainingCount: max(remainingCount, 0),
      pageIndex: max(pageIndex, 0),
      updatedAt: Date().timeIntervalSince1970
    )
  }

  @available(iOS 16.1, *)
  private static func endAllActivities(
    finalState: GroceryLiveActivityAttributes.ContentState,
    dismissalPolicy: ActivityUIDismissalPolicy
  ) async {
    for activity in Activity<GroceryLiveActivityAttributes>.activities {
      await activity.end(
        using: finalState,
        dismissalPolicy: dismissalPolicy
      )
    }
  }
}
