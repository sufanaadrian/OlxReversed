import { router } from "expo-router";
import { useState, useMemo} from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { Screen } from "../src/components/Screen";
import { useTranslation } from "../src/context/LanguageContext";
import { supabase } from "../src/lib/supabase";
import { makeStyles } from "./forgot-password.styles";
import { useTheme } from "../src/context/ThemeContext";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSend = async () => {
    setMsg("");
    setIsError(false);

    if (!email.trim()) {
      setMsg(t("fillAllRequired"));
      setIsError(true);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);

    if (error) {
      setMsg(error.message);
      setIsError(true);
    } else {
      setSent(true);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.h1}>{t("forgotPasswordHeader")}</Text>
          <Text style={styles.hint}>{t("forgotPasswordHint")}</Text>

          {sent ? (
            <Text style={styles.successMsg}>{t("resetLinkSent")}</Text>
          ) : (
            <>
              <Text style={styles.label}>{t("emailPlaceholder")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("emailPlaceholder")}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              {!!msg && (
                <Text style={isError ? styles.errorMsg : styles.successMsg}>
                  {msg}
                </Text>
              )}

              <Pressable
                style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
                onPress={onSend}
                disabled={loading}
              >
                <Text style={styles.sendBtnText}>
                  {loading ? t("working") : t("sendResetLink")}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            style={styles.backLink}
            onPress={() => router.replace("/sign-in" as any)}
          >
            <Text style={styles.backLinkText}>{t("backToSignIn")}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
