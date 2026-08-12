import ActivityKit
import Foundation

struct GroceryLiveActivityItem: Codable, Hashable {
  let id: String
  let text: String
}

struct GroceryLiveActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    let items: [GroceryLiveActivityItem]
    let remainingCount: Int
    let pageIndex: Int
    let updatedAt: Double

    var isComplete: Bool {
      remainingCount == 0
    }
  }

  let startedAt: Double
}
