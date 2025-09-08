import React, { Component, ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Global Error Boundary caught an error:", error, errorInfo);

    // Report to crash analytics in production
    if (!__DEV__) {
      // TODO: Report to Sentry/Bugsnag
      // crashlytics().recordError(error);
    }

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <AlertTriangle size={64} color={theme.colors.error} />

            <Text style={styles.title}>Something went wrong</Text>

            <Text style={styles.message}>
              {__DEV__ && this.state.error?.message
                ? this.state.error.message
                : "An unexpected error occurred. Please try restarting the app."}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
            >
              <RefreshCw size={20} color="white" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error?.stack && (
              <View style={styles.stackTrace}>
                <Text style={styles.stackTitle}>Stack Trace (Dev Only):</Text>
                <Text style={styles.stackText}>{this.state.error.stack}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing["4xl"],
  },
  title: {
    ...typography.heading2,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    color: theme.colors.neutral[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: theme.spacing["3xl"],
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  retryText: {
    ...typography.button,
    color: "white",
  },
  stackTrace: {
    marginTop: theme.spacing["3xl"],
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.sm,
    maxHeight: 200,
  },
  stackTitle: {
    ...typography.caption,
    fontWeight: "600",
    marginBottom: theme.spacing.sm,
  },
  stackText: {
    ...typography.caption,
    fontFamily: "monospace",
    fontSize: 10,
  },
});
