import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

type RequestStatus = "active" | "matched" | "closed";

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [requestsTotal, setRequestsTotal] = useState(0);
  const [requestsActive, setRequestsActive] = useState(0);
  const [requestsMatched, setRequestsMatched] = useState(0);
  const [requestsClosed, setRequestsClosed] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  const deals = useMemo(() => requestsMatched, [requestsMatched]);

  const loadUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? null);
    setUserId(data.user?.id ?? null);
  }, []);

  const loadStats = useCallback(async (uid: string | null) => {
    if (!uid) {
      setRequestsTotal(0);
      setRequestsActive(0);
      setRequestsMatched(0);
      setRequestsClosed(0);
      return;
    }

    const totalRes = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);

    const activeRes = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "active" as RequestStatus);

    const matchedRes = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "matched" as RequestStatus);

    const closedRes = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "closed" as RequestStatus);

    setRequestsTotal(totalRes.count ?? 0);
    setRequestsActive(activeRes.count ?? 0);
    setRequestsMatched(matchedRes.count ?? 0);
    setRequestsClosed(closedRes.count ?? 0);
  }, []);

  const loadAll = useCallback(async () => {
    await loadUser();

    // get fresh session user id right after loadUser
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;

    await loadStats(uid);
  }, [loadUser, loadStats]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadAll();
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setEmail(session?.user?.email ?? null);
        setUserId(session?.user?.id ?? null);
        await loadStats(session?.user?.id ?? null);
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAll, loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  const onAuthButtonPress = async () => {
    if (email) {
      setEmail(null);
      setUserId(null);
      await supabase.auth.signOut();
      return;
    }

    router.push({
      pathname: "/sign-in",
      params: { redirect: "/(tabs)/profile" },
    } as any);
  };

  const isLoggedIn = !!email;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 18 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Requests</Text>
          <Text style={styles.statValue}>{requestsTotal}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Deals</Text>
          <Text style={styles.statValue}>{deals}</Text>
        </View>
      </View>

      {isLoggedIn && (
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Requests breakdown</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownPill}>
              <Text style={styles.breakdownLabel}>Active</Text>
              <Text style={styles.breakdownValue}>{requestsActive}</Text>
            </View>

            <View style={styles.breakdownPill}>
              <Text style={styles.breakdownLabel}>Matched</Text>
              <Text style={styles.breakdownValue}>{requestsMatched}</Text>
            </View>

            <View style={styles.breakdownPill}>
              <Text style={styles.breakdownLabel}>Closed</Text>
              <Text style={styles.breakdownValue}>{requestsClosed}</Text>
            </View>
          </View>

          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push("/(tabs)/my-requests" as any)}
          >
            <Feather name="list" size={18} color={theme.primaryText} />
            <Text style={styles.quickBtnText}>My Requests</Text>
          </Pressable>

          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push("/(tabs)/my-offers" as any)}
          >
            <Feather name="briefcase" size={18} color={theme.primaryText} />
            <Text style={styles.quickBtnText}>My Offers</Text>
          </Pressable>
          <Pressable
            style={styles.authBtn}
            onPress={() =>
              Alert.alert(
                "About this app",
                "Welcome! This app helps you post requests and receive offers from other users.\n\nHow it works:\n• Go to Marketplace and swipe requests.\n• Swipe right to mark Interested and send an offer.\n• Swipe left to skip.\n• Offers can be edited or withdrawn from My Offers.\n• Request owners can review offers in My Requests → Offers.\n• If a seller withdraws, you’ll see it clearly in the offers history.\n\nTips:\n• Use filters to quickly find active/withdrawn items.\n• Pull down to refresh lists.\n\nNeed help? Contact support from the next update 🙂",
              )
            }
          >
            <Feather name="info" size={18} color={theme.primaryText} />
            <Text style={styles.authText}>About app</Text>
          </Pressable>
          <Pressable
            style={styles.authBtn}
            onPress={() =>
              Alert.alert(
                "Contact",
                "For problem contact support at support@reversedolx.com \n\n For problems contat 1234567890",
              )
            }
          >
            <Feather name="info" size={18} color={theme.primaryText} />
            <Text style={styles.authText}>Contact</Text>
          </Pressable>
        </View>
      )}

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
    </ScrollView>
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

  breakdownCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
  },
  breakdownTitle: { fontWeight: "900", color: theme.primaryText, fontSize: 14 },
  breakdownRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  breakdownPill: {
    flexGrow: 1,
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  breakdownLabel: {
    color: theme.secondaryText,
    fontWeight: "800",
    fontSize: 12,
  },
  breakdownValue: {
    marginTop: 4,
    color: theme.primaryText,
    fontWeight: "900",
    fontSize: 16,
  },

  quickBtn: {
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
  quickBtnText: { fontSize: 14, fontWeight: "900", color: theme.primaryText },

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
