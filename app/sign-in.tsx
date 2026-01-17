// app/sign-in.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../src/lib/supabase";

export default function SignInScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const goAfterAuth = () => {
    const target =
      redirect && redirect.startsWith("/") ? redirect : "/(tabs)/marketplace";
    router.replace(target as any);
  };

  const onCreateAccount = async () => {
    setLoading(true);
    setMsg("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    // If confirm email is OFF -> user may be logged in immediately (session exists)
    if (data.session) {
      goAfterAuth();
      return;
    }

    // If confirm email is ON -> session is null, user must confirm
    setMsg("Account created. Check your email to confirm, then sign in.");
  };

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
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Sign in</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 12, borderRadius: 12 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12, borderRadius: 12 }}
      />

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
          {loading ? "Working..." : "Sign In"}
        </Text>
      </Pressable>

      <Pressable
        onPress={onCreateAccount}
        disabled={loading}
        style={{
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Text style={{ textAlign: "center", fontWeight: "800" }}>
          {loading ? "Working..." : "Create account"}
        </Text>
      </Pressable>
    </View>
  );
}
