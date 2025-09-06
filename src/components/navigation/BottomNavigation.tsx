import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  BookOpen,
  ShoppingCart,
  Search,
  PlusSquare,
  User,
} from 'lucide-react-native';

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
  const tabs = [
    { id: 'dishlist', icon: BookOpen, label: 'DishList' },
    { id: 'grocery', icon: ShoppingCart, label: 'Grocery' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'builder', icon: PlusSquare, label: 'Builder' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigation}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress(tab.id)}
            >
              <IconComponent
                size={24}
                color={isActive ? '#274B75' : '#6B7280'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  tab: {
    padding: 12,
  },
});