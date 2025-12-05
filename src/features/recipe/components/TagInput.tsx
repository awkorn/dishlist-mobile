import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
}

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 25;

export default function TagInput({
  tags,
  onTagsChange,
  maxTags = MAX_TAGS,
  maxTagLength = MAX_TAG_LENGTH,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim();
    
    if (!trimmed) return;
    if (tags.length >= maxTags) return;
    if (trimmed.length > maxTagLength) return;
    
    // Check for duplicates (case-insensitive)
    const normalized = trimmed.toLowerCase();
    if (tags.some(tag => tag.toLowerCase() === normalized)) {
      setInputValue('');
      return;
    }

    onTagsChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleSubmitEditing = () => {
    addTag();
  };

  const canAddMore = tags.length < maxTags;

  // Display tag with first letter capitalized
  const formatTagDisplay = (tag: string): string => {
    return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
  };

  return (
    <View style={styles.container}>
      {/* Tag chips */}
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{formatTagDisplay(tag)}</Text>
            <TouchableOpacity
              onPress={() => removeTag(index)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={theme.colors.neutral[600]} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Input row */}
      {canAddMore && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Add a tag..."
            placeholderTextColor={theme.colors.neutral[400]}
            maxLength={maxTagLength}
            returnKeyType="done"
            onSubmitEditing={handleSubmitEditing}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              !inputValue.trim() && styles.addButtonDisabled,
            ]}
            onPress={addTag}
            disabled={!inputValue.trim()}
          >
            <Plus size={20} color={inputValue.trim() ? theme.colors.primary[500] : theme.colors.neutral[400]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Helper text */}
      <Text style={styles.helperText}>
        {tags.length}/{maxTags} tags • {maxTagLength} characters max per tag
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: theme.colors.primary[600],
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.neutral[800],
  },
  addButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.neutral[100],
  },
  helperText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
});