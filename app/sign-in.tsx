// app/sign-in.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { useTranslation } from "../src/context/LanguageContext";
import { supabase } from "../src/lib/supabase";

export default function SignInScreen() {
  const t = useTranslation();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If already signed in, go straight to app
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
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
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>
        {t("signinHeader")}
      </Text>

      <TextInput
        placeholder={t("emailPlaceholder")}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 12, borderRadius: 12 }}
      />

      <TextInput
        placeholder={t("passwordPlaceholder")}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12, borderRadius: 12 }}
      />

      <Pressable
        onPress={() => router.push("/forgot-password" as any)}
        style={{ alignSelf: "flex-end" }}
      >
        <Text style={{ fontSize: 13, color: "#1E40AF", fontWeight: "700" }}>
          {t("forgotPassword")}
        </Text>
      </Pressable>

      {!!msg && <Text style={{ color: "#334155" }}>{msg}</Text>}

      <Pressable
        onPress={onSignIn}
        disabled={loading}
        style={{
          padding: 14,
          borderRadius: 12,
          backgroundColor: "#1E40AF",
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "800" }}
        >
          {loading ? t("working") : t("signIn")}
        </Text>
      </Pressable>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 13, color: "#64748B" }}>
          {t("dontHaveAccount")}
        </Text>
        <Pressable onPress={() => router.replace("/sign-up" as any)}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1E40AF" }}>
            {t("signUp")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
