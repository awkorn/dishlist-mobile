import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

private enum DishListLiveActivityColors {
  static let background = Color(
    red: 0.0 / 255.0,
    green: 41.0 / 255.0,
    blue: 91.0 / 255.0
  )
  static let navy = Color(
    red: 0.0 / 255.0,
    green: 41.0 / 255.0,
    blue: 91.0 / 255.0
  )
  static let blue = Color(
    red: 37.0 / 255.0,
    green: 99.0 / 255.0,
    blue: 235.0 / 255.0
  )
  static let lockScreenForeground = Color.white
  static let lockScreenDisabled = Color.white.opacity(0.4)
  static let green = Color(
    red: 75.0 / 255.0,
    green: 212.0 / 255.0,
    blue: 145.0 / 255.0
  )
  static let white = Color.white
  static let muted = Color.white.opacity(0.67)
}

private enum DishListLiveActivityFonts {
  static func regular(_ size: CGFloat) -> Font {
    .custom("Geist-Regular", size: size)
  }

  static func medium(_ size: CGFloat) -> Font {
    .custom("Geist-Medium", size: size)
  }

  static func semiBold(_ size: CGFloat) -> Font {
    .custom("Geist-SemiBold", size: size)
  }

  static func bold(_ size: CGFloat) -> Font {
    .custom("Geist-Bold", size: size)
  }
}

private struct GroceryItemRowView: View {
  let item: GroceryLiveActivityItem

  var body: some View {
    HStack(spacing: 9) {
      ZStack {
        RoundedRectangle(cornerRadius: 4)
          .fill(DishListLiveActivityColors.background)
        RoundedRectangle(cornerRadius: 4)
          .stroke(
            DishListLiveActivityColors.lockScreenForeground,
            lineWidth: 1
          )
      }
      .frame(width: 14, height: 14)

      Text(item.text)
        .font(DishListLiveActivityFonts.medium(14))
        .foregroundStyle(DishListLiveActivityColors.lockScreenForeground)
        .lineLimit(1)

      Spacer(minLength: 4)
    }
    .frame(height: 22)
    .contentShape(Rectangle())
  }
}

private struct GroceryPagingButtonLabel: View {
  let systemName: String
  let isEnabled: Bool

  var body: some View {
    Image(systemName: systemName)
      .font(.system(size: 13, weight: .bold))
      .foregroundStyle(
        isEnabled
          ? DishListLiveActivityColors.lockScreenForeground
          : DishListLiveActivityColors.lockScreenDisabled
      )
      .frame(width: 28, height: 24)
  }
}

private struct GroceryLockScreenView: View {
  let state: GroceryLiveActivityAttributes.ContentState

  // Five 22pt rows with 3pt spacing between them. Keeping this viewport fixed
  // prevents the Live Activity from resizing as the remaining item count drops.
  private let viewportHeight: CGFloat = 122
  private let contentVerticalPadding: CGFloat = 12

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

  var body: some View {
    Group {
      if state.isComplete {
        HStack(spacing: 8) {
          Image(systemName: "checkmark.circle.fill")
            .foregroundStyle(DishListLiveActivityColors.lockScreenForeground)
          Text("Everything is checked off")
            .font(DishListLiveActivityFonts.medium(14))
            .foregroundStyle(DishListLiveActivityColors.lockScreenForeground)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 8)
      } else {
        HStack(alignment: .top, spacing: 0) {
          VStack(spacing: 3) {
            ForEach(visibleItems, id: \.id) { item in
              if #available(iOS 17.0, *) {
                Button(intent: CheckGroceryItemIntent(itemId: item.id)) {
                  GroceryItemRowView(item: item)
                }
                .buttonStyle(.plain)
              } else {
                GroceryItemRowView(item: item)
              }
            }
          }
          .frame(maxWidth: .infinity, alignment: .topLeading)
          .padding(.trailing, 8)

          Rectangle()
            .fill(DishListLiveActivityColors.lockScreenForeground)
            .frame(
              width: 1,
              height: viewportHeight + (contentVerticalPadding * 2)
            )
            .offset(y: -contentVerticalPadding)

          if #available(iOS 17.0, *) {
            VStack(spacing: 0) {
              Button(intent: ChangeGroceryPageIntent(direction: -1)) {
                GroceryPagingButtonLabel(
                  systemName: "chevron.up",
                  isEnabled: currentPage > 0
                )
              }
              .buttonStyle(.plain)
              .disabled(currentPage == 0)
              .accessibilityLabel("Previous grocery items")

              Spacer(minLength: 0)

              Button(intent: ChangeGroceryPageIntent(direction: 1)) {
                GroceryPagingButtonLabel(
                  systemName: "chevron.down",
                  isEnabled: currentPage < pageCount - 1
                )
              }
              .buttonStyle(.plain)
              .disabled(currentPage == pageCount - 1)
              .accessibilityLabel("Next grocery items")
            }
            .frame(height: viewportHeight)
            .padding(.leading, 8)
          } else {
            VStack(spacing: 0) {
              GroceryPagingButtonLabel(
                systemName: "chevron.up",
                isEnabled: false
              )
              Spacer(minLength: 0)
              GroceryPagingButtonLabel(
                systemName: "chevron.down",
                isEnabled: false
              )
            }
            .frame(height: viewportHeight)
            .padding(.leading, 8)
          }
        }
      }
    }
    .frame(height: viewportHeight, alignment: .topLeading)
    .padding(.horizontal, 16)
    .padding(.vertical, contentVerticalPadding)
    .activityBackgroundTint(DishListLiveActivityColors.background)
    .activitySystemActionForegroundColor(
      DishListLiveActivityColors.lockScreenForeground
    )
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
    .font(DishListLiveActivityFonts.regular(12))
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
            .font(DishListLiveActivityFonts.semiBold(12))
            .foregroundStyle(DishListLiveActivityColors.blue)
        }

        DynamicIslandExpandedRegion(.trailing) {
          Text("\(context.state.remainingCount) left")
            .font(DishListLiveActivityFonts.semiBold(12))
        }

        DynamicIslandExpandedRegion(.bottom) {
          if context.state.isComplete {
            Label("Shopping complete", systemImage: "checkmark.circle.fill")
              .font(DishListLiveActivityFonts.semiBold(15))
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
          .font(DishListLiveActivityFonts.bold(11))
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
