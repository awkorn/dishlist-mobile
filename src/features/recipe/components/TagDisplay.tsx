import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';

interface TagDisplayProps {
  tags: string[];
}

export default function TagDisplay({ tags }: TagDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  // Display tag with first letter capitalized
  const formatTagDisplay = (tag: string): string => {
    return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tags</Text>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{formatTagDisplay(tag)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  tagText: {
    ...typography.caption,
    color: theme.colors.neutral[700],
    fontWeight: '500',
  },
});