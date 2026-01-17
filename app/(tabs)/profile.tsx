import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import { supabase } from "../../src/lib/supabase";

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onAuthButtonPress = async () => {
    if (email) {
      // LOG OUT
      setEmail(null); // immediate UI update
      await supabase.auth.signOut();
      return;
    }

    // SIGN IN (optional redirect back to profile)
    router.push({
      pathname: "/sign-in",
      params: { redirect: "/(tabs)/profile" },
    } as any);
  };

  const isLoggedIn = !!email;

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.h1}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(email?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{isLoggedIn ? "User" : "Guest"}</Text>
            <Text style={styles.email}>{email ?? "Not signed in"}</Text>
          </View>
        </View>

        {/* Mock stats for now */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Requests</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Deals</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>

        <Pressable style={styles.authBtn} onPress={onAuthButtonPress}>
          <Feather
            name={isLoggedIn ? "log-out" : "log-in"}
            size={18}
            color={theme.primaryText}
          />
          <Text style={styles.authText}>
            {isLoggedIn ? "Log out" : "Sign in"}
          </Text>
        </Pressable>

        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </Screen>
  );
}

const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  h1: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.primaryText,
    marginBottom: 12,
  },

  card: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },

  avatar: {
    height: 48,
    width: 48,
    borderRadius: 16,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "900", color: theme.primaryText },

  name: { fontSize: 16, fontWeight: "800", color: theme.primaryText },
  email: { marginTop: 2, fontSize: 13, color: theme.secondaryText },

  statsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statLabel: { fontSize: 12, color: theme.secondaryText, fontWeight: "700" },
  statValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "900",
    color: theme.primaryText,
  },

  authBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  authText: { fontSize: 14, fontWeight: "900", color: theme.primaryText },

  version: {
    marginTop: 18,
    textAlign: "center",
    color: theme.secondaryText,
    fontSize: 12,
  },
});
