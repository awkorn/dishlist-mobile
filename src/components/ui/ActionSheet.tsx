import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { typography } from '../../styles/typography';
import { theme } from '../../styles/theme';

export interface ActionSheetOption {
  title: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<any>;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

const { height } = Dimensions.get('window');

export default function ActionSheet({
  visible,
  onClose,
  title,
  options,
}: ActionSheetProps) {
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 75,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView>
            <View style={styles.header}>
              <View style={styles.handle} />
              {title && (
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={20} color={theme.colors.neutral[500]} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.options}>
              {options.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      option.disabled && styles.optionDisabled,
                    ]}
                    onPress={() => {
                      if (!option.disabled) {
                        option.onPress();
                        onClose();
                      }
                    }}
                    disabled={option.disabled}
                  >
                    {IconComponent && (
                      <IconComponent
                        size={20}
                        color={
                          option.destructive
                            ? theme.colors.error
                            : option.disabled
                            ? theme.colors.neutral[400]
                            : theme.colors.neutral[700]
                        }
                      />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        option.destructive && styles.destructiveText,
                        option.disabled && styles.disabledText,
                      ]}
                    >
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: height * 0.7,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.neutral[300],
    borderRadius: 2,
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  options: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    ...typography.body,
    color: theme.colors.neutral[700],
    fontSize: 16,
  },
  destructiveText: {
    color: theme.colors.error,
  },
  disabledText: {
    color: theme.colors.neutral[400],
  },
});