export const theme = {
  colors: {
    primary: {
      50: "#F0F7FF",
      500: "#2563eb",
      600: "#274B75",
    },
    secondary: {
      50: "#1E3A8A",
    },
    neutral: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E5E5",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    background: "#F4F2EE",
    surface: "#FFFFFF",
    textPrimary: "#00295B",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 1,
      elevation: 3,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

export type Theme = typeof theme;
