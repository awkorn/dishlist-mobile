import React, { type ReactNode } from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { typography } from '../../styles/typography';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  closeButtonDisabled?: boolean;
  rightAction?: ReactNode;
  showDragHandle?: boolean;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeButtonDisabled = false,
  rightAction,
  showDragHandle = false,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {showDragHandle && (
          <View style={styles.dragHandleContainer} testID="modal-drag-handle">
            <View style={styles.dragHandle} />
          </View>
        )}
        {(title || showCloseButton || rightAction) && (
          <View style={styles.header}>
            <View style={styles.headerLeft} testID="modal-header-left-slot">
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  disabled={closeButtonDisabled}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                  accessibilityState={{ disabled: closeButtonDisabled }}
                >
                  <X size={24} color={theme.colors.neutral[600]} />
                </TouchableOpacity>
              )}
            </View>
            {title && (
              <Text
                style={styles.title}
                numberOfLines={1}
                accessibilityRole="header"
              >
                {title}
              </Text>
            )}
            <View style={styles.headerRight} testID="modal-header-right-slot">
              {rightAction}
            </View>
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    marginLeft: -theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.editorialNavigationTitle,
    flexShrink: 1,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.neutral[300],
  },
});
