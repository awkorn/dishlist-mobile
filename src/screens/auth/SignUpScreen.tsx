import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../providers/AuthProvider/AuthContext";
import { typography } from "../../styles/typography";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { theme } from "../../styles/theme";
import Button from "../../components/ui/Button";
import InlineError from "../../components/ui/InlineError";
import { getAuthErrorMessage } from "../../utils/errors";

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; action?: string } | null>(null);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    // Clear previous errors
    setError(null);

    // Field validation
    if (!firstName.trim()) {
      setError({ 
        message: 'First name is required',
        action: 'Please enter your first name',
      });
      return;
    }

    if (!lastName.trim()) {
      setError({ 
        message: 'Last name is required',
        action: 'Please enter your last name',
      });
      return;
    }

    if (!username.trim()) {
      setError({ 
        message: 'Username is required',
        action: 'Please choose a username',
      });
      return;
    }

    if (!email.trim()) {
      setError({ 
        message: 'Email is required',
        action: 'Please enter your email address',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({ 
        message: 'Invalid email address',
        action: 'Please enter a valid email',
      });
      return;
    }

    if (!password.trim()) {
      setError({ 
        message: 'Password is required',
        action: 'Please create a password',
      });
      return;
    }

    if (password.length < 6) {
      setError({ 
        message: 'Password is too short',
        action: 'Use at least 6 characters',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, {
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (result.error) {
        const errorInfo = getAuthErrorMessage({ code: result.error });
        setError(errorInfo);
      }
    } catch (err) {
      setError({
        message: 'Something went wrong',
        action: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>

        {/* Error Message */}
        {error && (
          <InlineError
            message={error.message}
            action={
              error.message.includes('account with this email')
                ? 'Go to Login'
                : undefined
            }
            onActionPress={
              error.message.includes('account with this email')
                ? () => navigation.navigate('Login')
                : undefined
            }
          />
        )}

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              error?.message.toLowerCase().includes('first name') && styles.inputError,
            ]}
            placeholder="First Name"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setError(null);
            }}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={[
              styles.input,
              error?.message.toLowerCase().includes('last name') && styles.inputError,
            ]}
            placeholder="Last Name"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setError(null);
            }}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={[
              styles.input,
              error?.message.toLowerCase().includes('username') && styles.inputError,
            ]}
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={[
              styles.input,
              error?.message.toLowerCase().includes('email') && styles.inputError,
            ]}
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!loading}
          />

          <TextInput
            style={[
              styles.input,
              error?.message.toLowerCase().includes('password') && styles.inputError,
            ]}
            placeholder="Password (min 6 characters)"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry
            autoComplete="password-new"
            editable={!loading}
          />

          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.signUpButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Login")}
            disabled={loading}
          >
            <Text style={styles.linkText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    paddingHorizontal: theme.spacing['4xl'],
    marginTop: -40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...typography.heading2,
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing['4xl'],
  },
  form: {
    marginBottom: theme.spacing['3xl'],
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.neutral[800],
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  signUpButton: {
    marginTop: theme.spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: theme.colors.neutral[500],
  },
  linkText: {
    color: theme.colors.primary[500],
    fontWeight: "600",
  },
});