import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import PagerView from "react-native-pager-view";
import { Search, Plus } from "lucide-react-native";
import { typography } from "../../styles/typography";
import DishListTile from "../../components/dishlist/DishListTile";
import { getDishLists, DishList } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

type TabType = "All" | "My DishLists" | "Collaborations" | "Following";

const { width } = Dimensions.get('window');
const tileWidth = (width - 60) / 2;

// Skeleton component for smooth loading
const SkeletonTile = () => (
  <View style={[styles.skeletonContainer, { width: tileWidth }]}>
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonBadges}>
        <View style={styles.skeletonBadge} />
        <View style={styles.skeletonBadge} />
      </View>
    </View>
  </View>
);

export default function DishListsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get preloaded data from auth context
  const { dishListsCache, isDishListsPreloaded } = useAuth();
  
  // Local state for additional data and loading
  const [tabData, setTabData] = useState<{[key: string]: DishList[]}>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const pagerRef = useRef<PagerView>(null);

  const tabs: TabType[] = [
    "All",
    "My DishLists", 
    "Collaborations",
    "Following",
  ];

  const tabToApiParam = {
    "All": "all",
    "My DishLists": "my", 
    "Collaborations": "collaborations",
    "Following": "following",
  };

  // Initialize with preloaded data
  useEffect(() => {
    if (isDishListsPreloaded && Object.keys(dishListsCache).length > 0) {
      setTabData(dishListsCache);
      setLoadedTabs(new Set(Object.keys(dishListsCache)));
      console.log('Using preloaded DishLists data');
    }
  }, [isDishListsPreloaded, dishListsCache]);

  const fetchDishLists = async (tab: TabType, isRefresh = false) => {
    try {
      const apiParam = tabToApiParam[tab];
      
      // Show loading indicator unless we have cached data
      const hasData = tabData[apiParam]?.length > 0;
      if (!hasData && !isRefresh) {
        setIsTabLoading(true);
      }

      const data = await getDishLists(apiParam);
      
      // Cache the data
      setTabData(prev => ({ ...prev, [apiParam]: data }));
      setLoadedTabs(prev => new Set([...prev, apiParam]));
      
    } catch (error) {
      console.error('Failed to fetch dishlists:', error);
      Alert.alert('Error', 'Failed to load DishLists');
    } finally {
      setIsTabLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when tab changes (only if not preloaded)
  useEffect(() => {
    const currentTab = tabs[activeTab];
    const apiParam = tabToApiParam[currentTab];
    
    // Only fetch if we don't have cached data
    if (!loadedTabs.has(apiParam)) {
      fetchDishLists(currentTab);
    }
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDishLists(tabs[activeTab], true);
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.setPage(index);
  };

  const filterDishLists = (lists: DishList[]) => {
    if (!searchQuery.trim()) return lists;
    
    return lists.filter((list) =>
      list.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getCurrentTabData = () => {
    const apiParam = tabToApiParam[tabs[activeTab]];
    return tabData[apiParam] || [];
  };

  const renderDishLists = (tab: TabType) => {
    const apiParam = tabToApiParam[tab];
    const currentData = tabData[apiParam] || [];
    const hasData = currentData.length > 0;
    const isFirstLoad = !loadedTabs.has(apiParam) && isTabLoading;

    // Show skeleton loading only on first load with no data
    if (isFirstLoad && !hasData) {
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {Array(4).fill(0).map((_, index) => (
              <SkeletonTile key={index} />
            ))}
          </View>
        </ScrollView>
      );
    }

    const filteredLists = filterDishLists(currentData);

    // Show empty state
    if (!isTabLoading && filteredLists.length === 0 && loadedTabs.has(apiParam)) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No DishLists match your search' : 'No DishLists found'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
          />
        }
      >
        <View style={styles.grid}>
          {filteredLists.map((dishList) => (
            <DishListTile key={dishList.id} dishList={dishList} />
          ))}
        </View>
      </ScrollView>
    );
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

      {/* Subtle loading indicator for tab switches */}
      {isTabLoading && getCurrentTabData().length > 0 && (
        <View style={styles.subtleLoadingBar}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.subtleLoadingText}>Updating...</Text>
        </View>
      )}

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
            onPress={() => handleTabChange(index)}
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
            {renderDishLists(tab)}
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
  subtleLoadingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  subtleLoadingText: {
    marginLeft: 8,
    ...typography.caption,
    color: "#2563eb",
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    ...typography.body,
    color: "#666",
    textAlign: "center",
  },
  // Skeleton styles
  skeletonContainer: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skeletonContent: {
    padding: 16,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginBottom: 12,
    width: '70%',
  },
  skeletonBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonBadge: {
    width: 20,
    height: 20,
    backgroundColor: '#E5E5E5',
    borderRadius: 6,
  },
});