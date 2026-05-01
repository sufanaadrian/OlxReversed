import { StyleSheet } from "react-native";

export const theme = {
  primary: "#0D9488",
  primaryLight: "#CCFBF1",
  primaryDark: "#0F766E",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  primaryText: "#0F172A",
  secondaryText: "#64748B",
  mutedText: "#94A3B8",
  border: "#E2E8F0",
  employer: "#7C3AED",
  employerLight: "#EDE9FE",
  linkedin: "#0A66C2",
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },

  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.primaryText,
    flex: 1,
    textAlign: "center",
  },

  scroll: { paddingBottom: 40 },

  // Header card
  headerCard: {
    margin: 16,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: "900", color: theme.primaryDark },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.primaryText,
    marginBottom: 8,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 8,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#CCFBF1",
  },
  verifiedText: { fontSize: 12, fontWeight: "700", color: theme.primary },
  memberSince: { fontSize: 12, color: theme.mutedText, marginTop: 4 },

  // Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.primaryText,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bioText: {
    fontSize: 15,
    color: theme.secondaryText,
    lineHeight: 22,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.primaryText,
    marginBottom: 2,
  },
  infoSubText: { fontSize: 13, color: theme.secondaryText },

  // Skills
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.primaryLight,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  skillChipText: { fontSize: 12, fontWeight: "700", color: theme.primaryDark },

  // LinkedIn button
  linkedinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    alignSelf: "flex-start",
  },
  linkedinBtnText: { fontSize: 14, fontWeight: "700", color: theme.linkedin },

  // Not found
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: { fontSize: 16, color: theme.mutedText },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  backBtnText: { color: "#FFFFFF", fontWeight: "700" },
});
