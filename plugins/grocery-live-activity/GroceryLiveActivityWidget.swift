import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

private enum DishListLiveActivityColors {
  static let navy = Color(
    red: 0.0 / 255.0,
    green: 35.0 / 255.0,
    blue: 78.0 / 255.0
  )
  static let blue = Color(
    red: 91.0 / 255.0,
    green: 150.0 / 255.0,
    blue: 255.0 / 255.0
  )
  static let green = Color(
    red: 75.0 / 255.0,
    green: 212.0 / 255.0,
    blue: 145.0 / 255.0
  )
  static let white = Color.white
  static let muted = Color.white.opacity(0.67)
  static let row = Color.white.opacity(0.085)
}

private struct GroceryItemRowView: View {
  let item: GroceryLiveActivityItem
  let isInteractive: Bool

  var body: some View {
    HStack(spacing: 9) {
      ZStack {
        Circle()
          .stroke(DishListLiveActivityColors.white.opacity(0.48), lineWidth: 1.4)
          .frame(width: 20, height: 20)

        if isInteractive {
          Circle()
            .fill(DishListLiveActivityColors.blue.opacity(0.18))
            .frame(width: 14, height: 14)
        }
      }

      Text(item.text)
        .font(.system(size: 14, weight: .medium, design: .rounded))
        .foregroundStyle(DishListLiveActivityColors.white)
        .lineLimit(1)

      Spacer(minLength: 4)
    }
    .frame(minHeight: 27)
    .padding(.horizontal, 10)
    .background(DishListLiveActivityColors.row, in: RoundedRectangle(cornerRadius: 9))
    .contentShape(Rectangle())
  }
}

private struct GroceryLockScreenView: View {
  let state: GroceryLiveActivityAttributes.ContentState

  private var pageCount: Int {
    max(
      (state.items.count + GroceryLiveActivityPaging.pageSize - 1) /
        GroceryLiveActivityPaging.pageSize,
      1
    )
  }

  private var currentPage: Int {
    min(max(state.pageIndex, 0), pageCount - 1)
  }

  private var visibleItems: [GroceryLiveActivityItem] {
    let start = currentPage * GroceryLiveActivityPaging.pageSize
    return Array(
      state.items
        .dropFirst(start)
        .prefix(GroceryLiveActivityPaging.pageSize)
    )
  }

  private var itemsOnlyInApp: Int {
    max(state.remainingCount - state.items.count, 0)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 9) {
      HStack(spacing: 10) {
        ZStack {
          RoundedRectangle(cornerRadius: 10)
            .fill(DishListLiveActivityColors.blue)
            .frame(width: 35, height: 35)
          Image(systemName: state.isComplete ? "checkmark" : "cart.fill")
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(DishListLiveActivityColors.white)
        }

        VStack(alignment: .leading, spacing: 1) {
          Text(state.isComplete ? "All done" : "Grocery run")
            .font(.system(size: 16, weight: .semibold, design: .rounded))
            .foregroundStyle(DishListLiveActivityColors.white)
          Text(state.isComplete ? "Nice work — your list is clear" : "DishList Shopping Mode")
            .font(.system(size: 11, weight: .medium, design: .rounded))
            .foregroundStyle(DishListLiveActivityColors.muted)
        }

        Spacer()

        if !state.isComplete {
          Text("\(state.remainingCount) left")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(DishListLiveActivityColors.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.11), in: Capsule())
        }
      }

      if state.isComplete {
        HStack(spacing: 8) {
          Image(systemName: "checkmark.circle.fill")
            .foregroundStyle(DishListLiveActivityColors.green)
          Text("Everything is checked off")
            .font(.system(size: 14, weight: .medium, design: .rounded))
            .foregroundStyle(DishListLiveActivityColors.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(11)
        .background(DishListLiveActivityColors.row, in: RoundedRectangle(cornerRadius: 11))
      } else {
        VStack(spacing: 5) {
          ForEach(visibleItems, id: \.id) { item in
            if #available(iOS 17.0, *) {
              Button(intent: CheckGroceryItemIntent(itemId: item.id)) {
                GroceryItemRowView(item: item, isInteractive: true)
              }
              .buttonStyle(.plain)
            } else {
              GroceryItemRowView(item: item, isInteractive: false)
            }
          }
        }

        if pageCount > 1 {
          if #available(iOS 17.0, *) {
            HStack(spacing: 10) {
              Button(intent: ChangeGroceryPageIntent(direction: -1)) {
                Image(systemName: "chevron.left")
                  .frame(width: 28, height: 24)
              }
              .buttonStyle(.plain)
              .disabled(currentPage == 0)

              Text("Page \(currentPage + 1) of \(pageCount)")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(DishListLiveActivityColors.muted)

              Button(intent: ChangeGroceryPageIntent(direction: 1)) {
                Image(systemName: "chevron.right")
                  .frame(width: 28, height: 24)
              }
              .buttonStyle(.plain)
              .disabled(currentPage == pageCount - 1)

              Spacer()

              if itemsOnlyInApp > 0 {
                Text("+\(itemsOnlyInApp) in app")
                  .font(.system(size: 10, weight: .medium, design: .rounded))
                  .foregroundStyle(DishListLiveActivityColors.muted)
              }
            }
            .foregroundStyle(DishListLiveActivityColors.white)
          } else {
            Text("+\(max(state.remainingCount - visibleItems.count, 0)) more in DishList")
              .font(.system(size: 11, weight: .medium, design: .rounded))
              .foregroundStyle(DishListLiveActivityColors.muted)
          }
        } else if #available(iOS 17.0, *) {
          Text("Tap a circle to check off an item")
            .font(.system(size: 10, weight: .medium, design: .rounded))
            .foregroundStyle(DishListLiveActivityColors.muted)
        }
      }
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 12)
    .activityBackgroundTint(DishListLiveActivityColors.navy)
    .activitySystemActionForegroundColor(DishListLiveActivityColors.white)
    .widgetURL(URL(string: "dishlist://grocery"))
  }
}

private struct DynamicIslandItemsView: View {
  let items: [GroceryLiveActivityItem]

  var body: some View {
    VStack(alignment: .leading, spacing: 5) {
      ForEach(items.prefix(2), id: \.id) { item in
        if #available(iOS 17.0, *) {
          Button(intent: CheckGroceryItemIntent(itemId: item.id)) {
            HStack(spacing: 7) {
              Image(systemName: "circle")
              Text(item.text).lineLimit(1)
              Spacer(minLength: 0)
            }
          }
          .buttonStyle(.plain)
        } else {
          Text("• \(item.text)")
            .lineLimit(1)
        }
      }
    }
    .font(.caption)
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct DishListGroceryLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: GroceryLiveActivityAttributes.self) { context in
      GroceryLockScreenView(state: context.state)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label("DishList", systemImage: "cart.fill")
            .font(.caption.weight(.semibold))
            .foregroundStyle(DishListLiveActivityColors.blue)
        }

        DynamicIslandExpandedRegion(.trailing) {
          Text("\(context.state.remainingCount) left")
            .font(.caption.weight(.semibold))
        }

        DynamicIslandExpandedRegion(.bottom) {
          if context.state.isComplete {
            Label("Shopping complete", systemImage: "checkmark.circle.fill")
              .font(.subheadline.weight(.semibold))
              .foregroundStyle(DishListLiveActivityColors.green)
          } else {
            DynamicIslandItemsView(items: context.state.items)
          }
        }
      } compactLeading: {
        Image(systemName: context.state.isComplete ? "checkmark" : "cart.fill")
          .foregroundStyle(
            context.state.isComplete
              ? DishListLiveActivityColors.green
              : DishListLiveActivityColors.blue
          )
      } compactTrailing: {
        Text("\(context.state.remainingCount)")
          .font(.caption2.weight(.bold))
      } minimal: {
        Image(systemName: "cart.fill")
          .foregroundStyle(DishListLiveActivityColors.blue)
      }
      .widgetURL(URL(string: "dishlist://grocery"))
      .keylineTint(DishListLiveActivityColors.blue)
    }
  }
}

@main
struct DishListGroceryLiveActivityBundle: WidgetBundle {
  var body: some Widget {
    DishListGroceryLiveActivity()
  }
}
