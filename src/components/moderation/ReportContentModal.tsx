import React, { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppModal from "@components/ui/Modal";
import Button from "@components/ui/Button";
import { TextField } from "@components/ui";
import { toast } from "@components/ui/toast";
import {
  ReportReason,
  ReportTargetType,
  submitReport,
} from "@services/reports";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

type ReportTargetLabel = "user" | "DishList" | "recipe";

interface ReportContentModalProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: ReportTargetLabel;
  onClose: () => void;
  onSubmitted?: () => void;
}

interface ReasonOption {
  value: ReportReason;
  label: string;
  description: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    value: "INAPPROPRIATE",
    label: "Inappropriate content",
    description: "Offensive, explicit, unsafe, or otherwise objectionable.",
  },
  {
    value: "HARASSMENT",
    label: "Harassment or bullying",
    description: "Targeted abuse, threats, or unwanted hostile behavior.",
  },
  {
    value: "SPAM",
    label: "Spam or scam",
    description: "Misleading, repetitive, promotional, or fraudulent content.",
  },
  {
    value: "OTHER",
    label: "Something else",
    description: "Another concern that DishList should review.",
  },
];

function getTitle(targetLabel: ReportTargetLabel) {
  switch (targetLabel) {
    case "DishList":
      return "Report DishList";
    case "recipe":
      return "Report Recipe";
    default:
      return "Report User";
  }
}

export function ReportContentModal({
  visible,
  targetType,
  targetId,
  targetLabel,
  onClose,
  onSubmitted,
}: ReportContentModalProps) {
  const [reason, setReason] = useState<ReportReason>("INAPPROPRIATE");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedReason = useMemo(
    () => REASON_OPTIONS.find((option) => option.value === reason),
    [reason]
  );

  const resetAndClose = () => {
    if (isSubmitting) return;
    setReason("INAPPROPRIATE");
    setDetails("");
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitReport({
        targetType,
        targetId,
        reason,
        details,
      });
      setReason("INAPPROPRIATE");
      setDetails("");
      onClose();
      onSubmitted?.();
      toast.success("Report submitted. Thanks—we'll review it.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={resetAndClose}
      title={getTitle(targetLabel)}
    >
      <View style={styles.content}>
        <Text style={styles.intro}>
          Reports are sent to DishList for review. Choose the reason that best
          matches your concern.
        </Text>

        <View style={styles.reasonList}>
          {REASON_OPTIONS.map((option) => {
            const isSelected = option.value === reason;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.reasonOption,
                  isSelected && styles.reasonOptionSelected,
                ]}
                onPress={() => setReason(option.value)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.reasonTextWrap}>
                  <Text style={styles.reasonLabel}>{option.label}</Text>
                  <Text style={styles.reasonDescription}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextField
          containerStyle={styles.detailsField}
          label="Details"
          style={styles.detailsInput}
          value={details}
          onChangeText={setDetails}
          placeholder={`Tell us what is wrong with this ${targetLabel}`}
          multiline
          maxLength={1000}
          textAlignVertical="top"
          helperText={`${selectedReason?.label || "Report"} reports are reviewed by the DishList team.`}
          showCharacterCount
        />

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!targetId || isSubmitting}
          style={styles.submitButton}
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  intro: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xl,
  },
  reasonList: {
    gap: theme.spacing.sm,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  reasonOptionSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginRight: theme.spacing.md,
  },
  radioOuterSelected: {
    borderColor: theme.colors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary[500],
  },
  reasonTextWrap: {
    flex: 1,
  },
  reasonLabel: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  reasonDescription: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    marginTop: 2,
  },
  detailsField: {
    marginTop: theme.spacing.xl,
  },
  detailsInput: {
    minHeight: 112,
  },
  submitButton: {
    marginTop: theme.spacing.xl,
  },
});
