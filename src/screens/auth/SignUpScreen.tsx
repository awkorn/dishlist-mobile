import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "../../providers/AuthProvider/AuthContext";
import { typography } from "../../styles/typography";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { theme } from "../../styles/theme";
import Button from "../../components/ui/Button";

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!firstName.trim()) {
      Alert.alert("Error", "Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Error", "Please enter your last name.");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Please enter email.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, {
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    setLoading(false);

    if (error) Alert.alert("Sign Up Failed", error);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
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