import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '@providers/AuthProvider/AuthContext';
import { getAuthErrorMessage } from '@lib/errors';
import { typography } from '@styles/typography';
import { theme } from '@styles/theme';
import Button from '@components/ui/Button';
import InlineError from '@components/ui/InlineError';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; action?: string } | null>(null);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    setError(null);

    if (!email.trim()) {
      setError({
        message: 'Email is required',
        action: 'Please enter your email address',
      });
      return;
    }

    if (!password.trim()) {
      setError({
        message: 'Password is required',
        action: 'Please enter your password',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email, password);

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

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    console.log('Forgot password for:', email);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={10}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../../assets/images/dishlist-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>DishList</Text>
        </View>

        {error && (
          <InlineError
            message={error.message}
            action={error.message.includes('password') ? 'Reset Password' : undefined}
            onActionPress={
              error.message.includes('password') ? handleForgotPassword : undefined
            }
          />
        )}

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              error?.message.toLowerCase().includes('email') && styles.inputError,
            ]}
            placeholder="Email"
            placeholderTextColor={theme.colors.neutral[400]}
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
            testID="email-input"
          />

          <TextInput
            style={[
              styles.input,
              error?.message.toLowerCase().includes('password') && styles.inputError,
            ]}
            placeholder="Password"
            placeholderTextColor={theme.colors.neutral[400]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
            testID="password-input"
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
          />

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New user? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            disabled={loading}
            testID="signup-link"
          >
            <Text style={styles.linkText}>Sign up</Text>
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
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['4xl'],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -150,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  logoContainer: {
    marginBottom: 15,
  },
  logo: {
    height: 80,
  },
  title: {
    ...typography.heading1,
    color: theme.colors.textPrimary,
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
    borderWidth: 1,
  },
  loginButton: {
    marginTop: theme.spacing.sm,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  forgotPasswordText: {
    ...typography.body,
    color: theme.colors.primary[500],
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: theme.colors.neutral[500],
  },
  linkText: {
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
});