import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import PagerView from "react-native-pager-view";
import { Search, Plus } from "lucide-react-native";
import { typography } from "../../styles/typography";
import DishListTile from "../../components/dishlist/DishListTile";

type TabType = "All" | "My DishLists" | "Collaborations" | "Following";

// Mock data - replace with actual API calls
const mockDishLists = [
  {
    id: "1",
    title: "My Recipes",
    recipeCount: 12,
    isDefault: true,
    isOwner: true,
    isCollaborator: false,
    isFollowing: false,
    visibility: "PRIVATE" as const,
  },
  {
    id: "2",
    title: "Family Recipes",
    recipeCount: 8,
    isDefault: false,
    isOwner: true,
    isCollaborator: false,
    isFollowing: false,
    visibility: "PUBLIC" as const,
  },
  {
    id: "3",
    title: "Summer BBQ Ideas",
    recipeCount: 15,
    isDefault: false,
    isOwner: false,
    isCollaborator: true,
    isFollowing: false,
    visibility: "PUBLIC" as const,
  },
    {
    id: "4",
    title: "Crockpot",
    recipeCount: 8,
    isDefault: false,
    isOwner: false,
    isCollaborator: false,
    isFollowing: true,
    visibility: "PUBLIC" as const,
  },
];

export default function DishListsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const pagerRef = useRef<PagerView>(null);

  const tabs: TabType[] = [
    "All",
    "My DishLists",
    "Collaborations",
    "Following",
  ];

  const filterDishLists = (tab: TabType) => {
    let filtered = [...mockDishLists];

    switch (tab) {
      case "My DishLists":
        filtered = filtered.filter((list) => list.isOwner);
        break;
      case "Collaborations":
        filtered = filtered.filter((list) => list.isCollaborator);
        break;
      case "Following":
        filtered = filtered.filter((list) => list.isFollowing);
        break;
      default:
        break;
    }

    if (searchQuery) {
      filtered = filtered.filter((list) =>
        list.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (tab === "All" || tab === "My DishLists") {
      filtered.sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      });
    }

    return filtered;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>DishLists</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your DishLists"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              setActiveTab(index);
              pagerRef.current?.setPage(index);
            }}
            style={[styles.tab, activeTab === index && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pager */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
      >
        {tabs.map((tab) => (
          <View key={tab} style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.grid}>
                {filterDishLists(tab).map((dishList) => (
                  <DishListTile key={dishList.id} dishList={dishList} />
                ))}
              </View>
            </ScrollView>
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F2EE",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    ...typography.heading2,
    color: "#00295B",
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: "#333",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#274B75",
  },
  tabText: {
    ...typography.body,
    color: "#666",
  },
  activeTabText: {
    color: "#274B75",
    fontWeight: "600",
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 100,
  },
});
