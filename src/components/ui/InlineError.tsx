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
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={16} color={theme.colors.error} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        
        {action && onActionPress && (
          <TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
            <Text style={styles.actionText}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2', 
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
    color: '#991B1B', 
    lineHeight: 20,
  },
  actionButton: {
    marginTop: theme.spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: theme.colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
});