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

function groupByDay(
  slots: AvailabilitySlot[],
): Map<number, AvailabilitySlot[]> {
  const map = new Map<number, AvailabilitySlot[]>();
  for (const s of slots) {
    const arr = map.get(s.day_of_week) ?? [];
    arr.push(s);
    map.set(s.day_of_week, arr);
  }
  return map;
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
  const grouped = groupByDay(slots);

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

      {Array.from(grouped.entries())
        .sort(([a], [b]) => a - b)
        .map(([dayIndex, daySlots]) => (
          <View key={dayIndex} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{t(DAY_KEYS[dayIndex])}</Text>
            </View>
            {daySlots.map((slot, idx) => {
              const status: SlotStatus =
                slotStatuses?.[slot.id] ??
                (slot.is_booked ? "booked" : "available");
              const isBooked = status === "booked";
              const isPending = status === "pending";
              const isSelected = selected.includes(slot.id);
              const isLast = idx === daySlots.length - 1;

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
                        <Text style={styles.pendingText}>
                          {t("slotPending")}
                        </Text>
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
