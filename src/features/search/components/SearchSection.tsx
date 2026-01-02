import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface SearchSectionProps {
  title: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
  isEmpty?: boolean;
}

export function SearchSection({ title, onSeeAll, children, isEmpty }: SearchSectionProps) {
  if (isEmpty) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
            <ChevronRight size={20} color={theme.colors.neutral[600]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  title: {
    ...typography.subtitle,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  seeAllButton: {
    padding: theme.spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
  },
});