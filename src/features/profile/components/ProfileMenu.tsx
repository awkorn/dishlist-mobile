import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { Ban, Flag, Settings, LogOut } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  onSettingsPress?: () => void;
  onLogoutPress?: () => void;
  onBlockPress?: () => void;
  onReportPress?: () => void;
}

export function ProfileMenu({
  visible,
  onClose,
  onSettingsPress,
  onLogoutPress,
  onBlockPress,
  onReportPress,
}: ProfileMenuProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menu}>
              {onSettingsPress && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onSettingsPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Settings size={20} color={theme.colors.neutral[700]} />
                  <Text style={styles.menuItemText}>Settings</Text>
                </TouchableOpacity>
              )}

              {onSettingsPress &&
                (onLogoutPress || onBlockPress || onReportPress) && (
                <View style={styles.divider} />
              )}

              {onReportPress && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onReportPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Flag size={20} color={theme.colors.neutral[700]} />
                  <Text style={styles.menuItemText}>Report User</Text>
                </TouchableOpacity>
              )}

              {onBlockPress && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onBlockPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Ban size={20} color={theme.colors.error} />
                  <Text style={[styles.menuItemText, styles.destructiveText]}>
                    Block User
                  </Text>
                </TouchableOpacity>
              )}

              {onLogoutPress && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onLogoutPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <LogOut size={20} color={theme.colors.error} />
                  <Text style={[styles.menuItemText, styles.destructiveText]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menu: {
    marginTop: 100, // Position below the header icons
    marginRight: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  menuItemText: {
    ...typography.body,
    color: theme.colors.neutral[700],
    fontSize: 16,
  },
  destructiveText: {
    color: theme.colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginHorizontal: theme.spacing.md,
  },
});
