import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
};

export const styles = StyleSheet.create({
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

  settingSection: {
    marginTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.primaryText,
    marginBottom: 10,
  },
  languageButtons: {
    flexDirection: "row",
    gap: 10,
  },
  languageBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  languageBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  languageBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
  },
  languageBtnTextActive: {
    color: "white",
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
