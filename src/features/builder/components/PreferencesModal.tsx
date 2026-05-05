import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Ban,
  Dumbbell,
  Leaf,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface PreferenceOption {
  label: string;
  value: string;
}

interface PreferenceSection {
  title: string;
  type: "single" | "multiple";
  icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth?: number;
  }>;
  options: PreferenceOption[];
}

interface PreferencesModalProps {
  visible: boolean;
  selectedPreferences: string[];
  onClose: () => void;
  onSave: (preferences: string[]) => void;
}

const PREFERENCE_SECTIONS: PreferenceSection[] = [
  {
    title: "Diet",
    type: "single",
    icon: Leaf,
    options: [
      { label: "Paleo", value: "Paleo" },
      { label: "Keto", value: "Keto" },
      { label: "Vegetarian", value: "Vegetarian" },
      { label: "Vegan", value: "Vegan" },
    ],
  },
  {
    title: "I'm Avoiding",
    type: "multiple",
    icon: Ban,
    options: [
      { label: "Gluten", value: "Avoid gluten" },
      { label: "Dairy", value: "Avoid dairy" },
      { label: "Soy", value: "Avoid soy" },
      { label: "Peanuts", value: "Avoid peanuts" },
      { label: "Tree nuts", value: "Avoid tree nuts" },
      { label: "Shellfish", value: "Avoid shellfish" },
    ],
  },
  {
    title: "Nutrition",
    type: "multiple",
    icon: Dumbbell,
    options: [
      { label: "High protein", value: "High protein" },
      { label: "Low calorie", value: "Low calorie" },
      { label: "Low carb", value: "Low carb" },
    ],
  },
];

const STANDARD_PREFERENCES = new Set(
  PREFERENCE_SECTIONS.flatMap((section) =>
    section.options.map((option) => option.value)
  )
);

export function PreferencesModal({
  visible,
  selectedPreferences,
  onClose,
  onSave,
}: PreferencesModalProps) {
  const insets = useSafeAreaInsets();
  const [draftSelections, setDraftSelections] = useState<Set<string>>(
    () => new Set()
  );
  const [customPreferences, setCustomPreferences] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    if (!visible) return;

    setDraftSelections(
      new Set(
        selectedPreferences.filter((preference) =>
          STANDARD_PREFERENCES.has(preference)
        )
      )
    );
    setCustomPreferences(
      selectedPreferences.filter(
        (preference) => !STANDARD_PREFERENCES.has(preference)
      )
    );
    setCustomText("");
  }, [selectedPreferences, visible]);

  const togglePreference = (section: PreferenceSection, value: string) => {
    setDraftSelections((currentSelections) => {
      const nextSelections = new Set(currentSelections);

      if (section.type === "single") {
        section.options.forEach((option) => nextSelections.delete(option.value));

        if (!currentSelections.has(value)) {
          nextSelections.add(value);
        }

        return nextSelections;
      }

      if (nextSelections.has(value)) {
        nextSelections.delete(value);
      } else {
        nextSelections.add(value);
      }

      return nextSelections;
    });
  };

  const addCustomPreference = () => {
    const preference = customText.trim();
    if (!preference) return;

    setCustomPreferences((currentPreferences) => {
      if (
        currentPreferences.some(
          (currentPreference) =>
            currentPreference.toLowerCase() === preference.toLowerCase()
        )
      ) {
        return currentPreferences;
      }

      return [...currentPreferences, preference];
    });
    setCustomText("");
  };

  const removeCustomPreference = (preference: string) => {
    setCustomPreferences((currentPreferences) =>
      currentPreferences.filter(
        (currentPreference) => currentPreference !== preference
      )
    );
  };

  const handleSave = () => {
    const selectedStandardPreferences = PREFERENCE_SECTIONS.flatMap((section) =>
      section.options
        .filter((option) => draftSelections.has(option.value))
        .map((option) => option.value)
    );
    const pendingCustomPreference = customText.trim();
    const customValues = pendingCustomPreference
      ? [...customPreferences, pendingCustomPreference]
      : customPreferences;
    const uniqueCustomValues = customValues.filter(
      (preference, index, preferences) =>
        preferences.findIndex(
          (currentPreference) =>
            currentPreference.toLowerCase() === preference.toLowerCase()
        ) === index
    );

    onSave([...selectedStandardPreferences, ...uniqueCustomValues]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + theme.spacing.lg },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close preferences"
              hitSlop={8}
            >
              <X size={18} color={theme.colors.neutral[700]} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Preferences</Text>
              <Text style={styles.subtitle}>
                Add nutrition preferences to customize recipe results.
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {PREFERENCE_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <SectionHeader section={section} />
                <View style={styles.chipRow}>
                  {section.options.map((option) => {
                    const selected = draftSelections.has(option.value);
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => togglePreference(section, option.value)}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.section}>
              <SectionHeader
                section={{
                  title: "Custom",
                  type: "multiple",
                  icon: SlidersHorizontal,
                  options: [],
                }}
              />
              {customPreferences.length > 0 && (
                <View style={styles.chipRow}>
                  {customPreferences.map((preference) => (
                    <TouchableOpacity
                      key={preference}
                      style={[
                        styles.chip,
                        styles.chipSelected,
                        styles.customChip,
                      ]}
                      onPress={() => removeCustomPreference(preference)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${preference}`}
                    >
                      <Text style={[styles.chipText, styles.chipTextSelected]}>
                        {preference}
                      </Text>
                      <X size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  value={customText}
                  onChangeText={setCustomText}
                  placeholder="Add preference"
                  placeholderTextColor={theme.colors.neutral[400]}
                  returnKeyType="done"
                  onSubmitEditing={addCustomPreference}
                />
                <TouchableOpacity
                  style={[
                    styles.addCustomButton,
                    !!customText.trim() && styles.addCustomButtonActive,
                  ]}
                  onPress={addCustomPreference}
                  disabled={!customText.trim()}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Add custom preference"
                >
                  <Plus
                    size={18}
                    color={
                      customText.trim()
                        ? "#FFFFFF"
                        : theme.colors.primary[500]
                    }
                    strokeWidth={2.2}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Save preferences"
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionHeader({ section }: { section: PreferenceSection }) {
  const Icon = section.icon;

  return (
    <View style={styles.sectionHeader}>
      <Icon size={14} color={theme.colors.textPrimary} strokeWidth={2} />
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },
  sheet: {
    maxHeight: "78%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  headerSpacer: {
    width: 28,
  },
  title: {
    ...typography.subtitle,
    color: theme.colors.neutral[900],
    fontSize: 17,
    lineHeight: 22,
  },
  subtitle: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    fontFamily: "Inter-SemiBold",
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  chip: {
    minWidth: 74,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    backgroundColor: theme.colors.textPrimary,
  },
  chipText: {
    ...typography.caption,
    fontFamily: "Inter-SemiBold",
    color: theme.colors.textPrimary,
    fontSize: 10,
    lineHeight: 13,
    textTransform: "uppercase",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  customChip: {
    paddingRight: theme.spacing.sm,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  customInput: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    ...typography.caption,
    color: theme.colors.neutral[800],
  },
  addCustomButton: {
    width: 74,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  addCustomButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  saveButton: {
    height: 46,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary[500],
  },
  saveButtonText: {
    ...typography.button,
    color: "#FFFFFF",
  },
});
