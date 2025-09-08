import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
} from 'react-native';
import { X } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { typography } from '../../styles/typography';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {(title || showCloseButton) && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={theme.colors.neutral[600]} />
                </TouchableOpacity>
              )}
            </View>
            {title && <Text style={styles.title}>{title}</Text>}
            <View style={styles.headerRight} />
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    width: 32,
  },
  headerRight: {
    width: 32,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
  },
});