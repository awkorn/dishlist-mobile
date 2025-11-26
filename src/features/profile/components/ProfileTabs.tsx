import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { ProfileTab } from '../types';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'DishLists' && styles.activeTab]}
        onPress={() => onTabChange('DishLists')}
      >
        <Text style={[styles.tabText, activeTab === 'DishLists' && styles.activeTabText]}>
          DishLists
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'Recipes' && styles.activeTab]}
        onPress={() => onTabChange('Recipes')}
      >
        <Text style={[styles.tabText, activeTab === 'Recipes' && styles.activeTabText]}>
          Recipes
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.secondary[50],
    marginHorizontal: 10,
  },
  tabText: {
    ...typography.subtitle,
    color: theme.colors.neutral[500],
  },
  activeTabText: {
    color: theme.colors.secondary[50],
    fontWeight: '600',
  },
});