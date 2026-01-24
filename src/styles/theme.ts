export const theme = {
  colors: {
    primary: {
      50: "#EEF2EC", // subtle backgrounds, chips
      500: "#3F4F3C", // primary actions
      600: "#2F3E34", // pressed / emphasis
    },
    secondary: {
      50: "#8FA79B",
    },
    neutral: {
      50: "#f6f6f6", // cards
      100: "#F6F3EE", // background
      200: "#E4DED4", // borders
      300: "#D2CCC2",
      400: "#B7B1A6",
      500: "#7D8269",
      600: "#60654D",
      700: "#454B35",
      800: "#2D3221",
      900: "#1A1D13",
    },
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    background: "#F4F2EE",
    surface: "#FFFFFF",
    textPrimary: "#3F4F3C",
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
