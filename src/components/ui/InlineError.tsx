import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { typography } from '../../styles/typography';

interface InlineErrorProps {
  message: string;
  action?: string;
  onActionPress?: () => void;
}

export default function InlineError({ 
  message, 
  action, 
  onActionPress 
}: InlineErrorProps) {
  if (!message) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.iconContainer}>
        <AlertCircle size={16} color={theme.colors.error} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        
        {action &&
          (onActionPress ? (
            <TouchableOpacity
              onPress={onActionPress}
              accessibilityRole="button"
            >
              <Text style={styles.actionText}>{action}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.actionText}>{action}</Text>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  message: {
    ...typography.body,
    fontSize: 14,
    color: theme.colors.errorText,
    lineHeight: 20,
  },
  actionText: {
    ...typography.label,
    color: theme.colors.error,
    fontSize: 13,
    marginTop: theme.spacing.xs,
  },
});
