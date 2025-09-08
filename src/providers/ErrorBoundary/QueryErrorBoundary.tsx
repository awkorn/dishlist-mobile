import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Query Error Boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <AlertCircle size={40} color={theme.colors.error} />

          <Text style={styles.title}>
            {this.props.title || "Unable to load data"}
          </Text>

          <Text style={styles.message}>
            {this.props.message ||
              "Something went wrong while loading. Please try again."}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleRetry}
          >
            <RefreshCw size={16} color={theme.colors.primary[500]} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingVertical: theme.spacing["4xl"],
  },
  title: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    color: theme.colors.neutral[600],
    textAlign: "center",
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  retryText: {
    ...typography.button,
    color: theme.colors.primary[500],
    fontSize: 14,
  },
});
