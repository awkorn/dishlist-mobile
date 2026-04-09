import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from "react-native";
import { ArrowUp } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface BuilderChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function BuilderChatInput({
  onSend,
  disabled = false,
  placeholder = "e.g. spicy chicken marinade",
}: BuilderChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    // Keep keyboard open for multi-turn conversation
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral[400]}
          multiline
          maxLength={500}
          editable={!disabled}
          returnKeyType="default"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          <ArrowUp
            size={20}
            color={canSend ? "#FFFFFF" : theme.colors.neutral[400]}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    backgroundColor: theme.colors.background,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    paddingLeft: theme.spacing.lg,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  input: {
    flex: 1,
    ...typography.body,
    color: theme.colors.neutral[800],
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: theme.colors.primary[500],
  },
});
