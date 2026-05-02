import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { Screen } from "../src/components/Screen";
import { useTranslation } from "../src/context/LanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { supabase } from "../src/lib/supabase";
import { makeStyles } from "./sign-up.styles";

export default function SignUpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    setMsg("");
    setIsError(false);

    if (
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !username.trim()
    ) {
      setMsg(t("fillAllRequired"));
      setIsError(true);
      return;
    }

    if (password !== confirmPassword) {
      setMsg(t("passwordsDoNotMatch"));
      setIsError(true);
      return;
    }

    if (password.length < 6) {
      setMsg(t("passwordTooShort"));
      setIsError(true);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { username: username.trim() } },
    });

    setLoading(false);

    if (error) {
      const alreadyExists =
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists");
      setMsg(alreadyExists ? t("userAlreadyRegistered") : error.message);
      setIsError(true);
      return;
    }

    if (data.session && data.user) {
      await supabase
        .from("profiles")
        .upsert(
          { id: data.user.id, username: username.trim() },
          { onConflict: "id" },
        );
      router.replace("/onboarding" as any);
    } else {
      // email confirmation enabled
      setMsg(t("checkYourEmail"));
      setIsError(false);
    }
  };

  return (
    <Screen backgroundColor={colors.bg}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>{t("createAccount")}</Text>
          <Text style={styles.subtitle}>{t("signUpSubtitle")}</Text>

          <Text style={styles.label}>
            {t("username")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={t("usernamePlaceholder")}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text style={styles.label}>
            {t("email")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>
            {t("password")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t("passwordPlaceholder")}
            secureTextEntry
          />

          <Text style={styles.label}>
            {t("confirmPassword")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t("confirmPasswordPlaceholder")}
            secureTextEntry
          />

          {msg ? (
            <Text style={isError ? styles.errorMsg : styles.successMsg}>
              {msg}
            </Text>
          ) : null}

          <Pressable
            style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
            onPress={onSignUp}
            disabled={loading}
          >
            <Text style={styles.continueBtnText}>
              {loading ? t("loading") : t("createAccount")}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("alreadyHaveAccount")}</Text>
            <Pressable onPress={() => router.replace("/sign-in" as any)}>
              <Text style={styles.footerLink}>{t("signIn")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
