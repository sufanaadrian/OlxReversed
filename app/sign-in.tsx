// app/sign-in.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
} from "react-native";
import { Screen } from "../src/components/Screen";
import { useTranslation } from "../src/context/LanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { supabase } from "../src/lib/supabase";
import { makeStyles } from "./sign-in.styles";

export default function SignInScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          router.replace("/(tabs)/marketplace" as any);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const goAfterAuth = () => {
    const target =
      redirect && redirect.startsWith("/") ? redirect : "/(tabs)/marketplace";
    router.replace(target as any);
  };

  if (loading) {
    return (
      <Screen backgroundColor={colors.bg}>
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
        />
      </Screen>
    );
  }

  const onSignIn = async () => {
    setLoading(true);
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    goAfterAuth();
  };

  return (
    <Screen backgroundColor={colors.bg}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>{t("signinHeader")}</Text>
          <Text style={styles.subtitle}>{t("signInSubtitle")}</Text>

          <Text style={styles.label}>{t("email")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("emailPlaceholder")}
            placeholderTextColor={colors.mutedText}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCorrect={false}
          />

          <Text style={styles.label}>{t("password")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("passwordPlaceholder")}
            placeholderTextColor={colors.mutedText}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            onPress={() => router.push("/forgot-password" as any)}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>{t("forgotPassword")}</Text>
          </Pressable>

          {!!msg && <Text style={styles.errorMsg}>{msg}</Text>}

          <Pressable
            onPress={onSignIn}
            disabled={loading}
            style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
          >
            <Text style={styles.continueBtnText}>
              {loading ? t("working") : t("signIn")}
            </Text>
          </Pressable>

          <KeyboardAvoidingView style={styles.footer}>
            <Text style={styles.footerText}>{t("dontHaveAccount")}</Text>
            <Pressable onPress={() => router.replace("/sign-up" as any)}>
              <Text style={styles.footerLink}>{t("signUp")}</Text>
            </Pressable>
          </KeyboardAvoidingView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
