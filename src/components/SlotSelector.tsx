import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "../context/LanguageContext";
import { styles } from "./SlotSelector.styles";

// ── Types ────────────────────────────────────────────────────────────

export type AvailabilitySlot = {
  id: string;
  day_of_week: number; // 0=Mon … 6=Sun
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string;
  is_booked: boolean;
  date?: string | null; // "YYYY-MM-DD" — date-specific slot
};

type SlotStatus = "available" | "pending" | "booked";

// ── Helpers ──────────────────────────────────────────────────────────

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function formatTime(t: string): string {
  return t.slice(0, 5); // "HH:MM:SS" → "HH:MM"
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function hasDates(slots: AvailabilitySlot[]): boolean {
  return slots.some((s) => !!s.date);
}

type GroupEntry = { key: string; label: string; slots: AvailabilitySlot[] };

function groupSlots(
  slots: AvailabilitySlot[],
  dayKeys: readonly string[],
  t: (k: string) => string,
): GroupEntry[] {
  if (hasDates(slots)) {
    // Group by date, sort by date
    const map = new Map<string, AvailabilitySlot[]>();
    for (const s of slots) {
      const key = s.date ?? `day-${s.day_of_week}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, daySlots]) => ({
        key,
        label: key.startsWith("day-")
          ? t(dayKeys[Number(key.replace("day-", ""))])
          : formatDateLabel(key),
        slots: daySlots.sort((a, b) =>
          a.start_time.localeCompare(b.start_time),
        ),
      }));
  }

  // Fallback: group by day_of_week
  const map = new Map<number, AvailabilitySlot[]>();
  for (const s of slots) {
    const arr = map.get(s.day_of_week) ?? [];
    arr.push(s);
    map.set(s.day_of_week, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayIndex, daySlots]) => ({
      key: String(dayIndex),
      label: t(dayKeys[dayIndex]),
      slots: daySlots,
    }));
}

// ── Main component ───────────────────────────────────────────────────

type Props = {
  slots: AvailabilitySlot[];
  selected: string[]; // array of availability ids
  onToggle: (slotId: string) => void;
  /** Override statuses (e.g. "pending" for slots with pending offers) */
  slotStatuses?: Record<string, SlotStatus>;
};

export function SlotSelector({
  slots,
  selected,
  onToggle,
  slotStatuses,
}: Props) {
  const t = useTranslation();
  const groups = groupSlots(slots, DAY_KEYS, t);

  if (slots.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{t("noSlotsAvailable")}</Text>
      </View>
    );
  }

  const selectedCount = selected.length;

  return (
    <View style={styles.container}>
      {selectedCount > 0 && (
        <View style={styles.selectedSummary}>
          <Text style={styles.selectedSummaryText}>
            {selectedCount}{" "}
            {selectedCount === 1 ? t("slotSelected") : t("slotsSelected")}
          </Text>
        </View>
      )}

      {groups.map((group) => (
        <View key={group.key} style={styles.daySection}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>{group.label}</Text>
          </View>
          {group.slots.map((slot, idx) => {
            const status: SlotStatus =
              slotStatuses?.[slot.id] ??
              (slot.is_booked ? "booked" : "available");
            const isBooked = status === "booked";
            const isPending = status === "pending";
            const isSelected = selected.includes(slot.id);
            const isLast = idx === group.slots.length - 1;

            return (
              <Pressable
                key={slot.id}
                style={[
                  styles.slotBtn,
                  isLast && styles.slotBtnLast,
                  isSelected && styles.slotBtnSelected,
                  isBooked && styles.slotBtnBooked,
                  isPending && !isBooked && styles.slotBtnPending,
                ]}
                onPress={() => {
                  if (!isBooked && !isPending) onToggle(slot.id);
                }}
                disabled={isBooked || isPending}
              >
                <Text
                  style={[styles.slotTime, isBooked && styles.slotTimeBooked]}
                >
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </Text>

                <View style={styles.slotStatusRow}>
                  {isBooked && (
                    <View style={styles.bookedPill}>
                      <Text style={styles.bookedText}>{t("slotBooked")}</Text>
                    </View>
                  )}
                  {isPending && !isBooked && (
                    <View style={styles.pendingPill}>
                      <Text style={styles.pendingText}>{t("slotPending")}</Text>
                    </View>
                  )}
                  {!isBooked && !isPending && (
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected && styles.checkCircleSelected,
                      ]}
                    >
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
