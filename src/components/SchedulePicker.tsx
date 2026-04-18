import React, { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "../context/LanguageContext";
import { styles } from "./SchedulePicker.styles";

// ── Types ────────────────────────────────────────────────────────────

export type TimeSlot = {
  id: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
};

export type DaySchedule = {
  dayIndex: number; // 0=Mon … 6=Sun
  enabled: boolean;
  slots: TimeSlot[];
};

export type WeekSchedule = DaySchedule[];

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

let _idCounter = 0;
const uid = () => `slot-${++_idCounter}-${Date.now()}`;

export function emptyWeek(): WeekSchedule {
  return DAY_KEYS.map((_, i) => ({
    dayIndex: i,
    enabled: false,
    slots: [],
  }));
}

export function weekHasSlots(week: WeekSchedule): boolean {
  return week.some((d) => d.enabled && d.slots.length > 0);
}

// ── Quick presets ────────────────────────────────────────────────────

type Preset = {
  key: string;
  days: number[];
  slots: { start: string; end: string }[];
};

const PRESETS: Preset[] = [
  { key: "presetMornings", days: [0, 1, 2, 3, 4], slots: [{ start: "08:00", end: "12:00" }] },
  { key: "presetAfternoons", days: [0, 1, 2, 3, 4], slots: [{ start: "13:00", end: "17:00" }] },
  { key: "presetFullWeekdays", days: [0, 1, 2, 3, 4], slots: [{ start: "08:00", end: "17:00" }] },
  { key: "presetWeekends", days: [5, 6], slots: [{ start: "09:00", end: "15:00" }] },
  { key: "presetEvenings", days: [0, 1, 2, 3, 4], slots: [{ start: "18:00", end: "21:00" }] },
];

// ── Time picker ──────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const MINUTES = ["00", "15", "30", "45"];

type TimePickerProps = {
  visible: boolean;
  title: string;
  initial: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
};

function TimePicker({ visible, title, initial, onConfirm, onCancel }: TimePickerProps) {
  const t = useTranslation();
  const [hour, setHour] = useState(initial.split(":")[0] ?? "08");
  const [minute, setMinute] = useState(initial.split(":")[1] ?? "00");

  React.useEffect(() => {
    if (visible) {
      setHour(initial.split(":")[0] ?? "08");
      setMinute(initial.split(":")[1] ?? "00");
    }
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.pickerBackdrop} onPress={onCancel}>
        <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.pickerTitle}>{title}</Text>

          {/* Hour grid */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t("scheduleHour")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 4 }}
            >
              {HOURS.map((h) => (
                <Pressable
                  key={h}
                  style={[styles.pickerDigitBtn, h === hour && styles.pickerDigitBtnActive]}
                  onPress={() => setHour(h)}
                >
                  <Text style={styles.pickerDigitText}>{h}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Minute chips */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t("scheduleMinute")}
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {MINUTES.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.pickerDigitBtn, { flex: 1 }, m === minute && styles.pickerDigitBtnActive]}
                  onPress={() => setMinute(m)}
                >
                  <Text style={styles.pickerDigitText}>{m}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Preview */}
          <Text style={{ textAlign: "center", fontSize: 28, fontWeight: "900", color: "#020617" }}>
            {hour}:{minute}
          </Text>

          <View style={styles.pickerActionsRow}>
            <Pressable style={styles.pickerCancelBtn} onPress={onCancel}>
              <Text style={styles.pickerCancelText}>{t("cancel")}</Text>
            </Pressable>
            <Pressable
              style={styles.pickerConfirmBtn}
              onPress={() => onConfirm(`${hour}:${minute}`)}
            >
              <Text style={styles.pickerConfirmText}>{t("confirm")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main component ───────────────────────────────────────────────────

type Props = {
  value: WeekSchedule;
  onChange?: (value: WeekSchedule) => void;
  readOnly?: boolean;
  /** Optional: slot statuses for display (keyed by availability id) */
  slotStatuses?: Record<string, "available" | "pending" | "booked">;
};

export function SchedulePicker({ value, onChange, readOnly, slotStatuses }: Props) {
  const t = useTranslation();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{
    dayIndex: number;
    slotId: string;
    field: "start" | "end";
  } | null>(null);
  const [pickerInitial, setPickerInitial] = useState("08:00");

  const toggleDay = useCallback(
    (dayIndex: number) => {
      if (readOnly) return;
      const next = value.map((d) => {
        if (d.dayIndex !== dayIndex) return d;
        const enabled = !d.enabled;
        return {
          ...d,
          enabled,
          slots: enabled && d.slots.length === 0
            ? [{ id: uid(), start: "08:00", end: "17:00" }]
            : d.slots,
        };
      });
      onChange?.(next);
    },
    [value, onChange, readOnly],
  );

  const addSlot = useCallback(
    (dayIndex: number) => {
      if (readOnly) return;
      const next = value.map((d) => {
        if (d.dayIndex !== dayIndex) return d;
        const lastSlot = d.slots[d.slots.length - 1];
        const newStart = lastSlot ? lastSlot.end : "08:00";
        const newEndH = Math.min(23, Number(newStart.split(":")[0]) + 2);
        const newEnd = `${String(newEndH).padStart(2, "0")}:${newStart.split(":")[1]}`;
        return { ...d, slots: [...d.slots, { id: uid(), start: newStart, end: newEnd }] };
      });
      onChange?.(next);
    },
    [value, onChange, readOnly],
  );

  const removeSlot = useCallback(
    (dayIndex: number, slotId: string) => {
      if (readOnly) return;
      const next = value.map((d) => {
        if (d.dayIndex !== dayIndex) return d;
        const slots = d.slots.filter((s) => s.id !== slotId);
        return { ...d, slots, enabled: slots.length > 0 ? d.enabled : false };
      });
      onChange?.(next);
    },
    [value, onChange, readOnly],
  );

  const openTimePicker = (dayIndex: number, slotId: string, field: "start" | "end", currentVal: string) => {
    if (readOnly) return;
    setPickerTarget({ dayIndex, slotId, field });
    setPickerInitial(currentVal);
    setPickerVisible(true);
  };

  const onTimeConfirm = (time: string) => {
    if (!pickerTarget) return;
    const { dayIndex, slotId, field } = pickerTarget;
    const next = value.map((d) => {
      if (d.dayIndex !== dayIndex) return d;
      return {
        ...d,
        slots: d.slots.map((s) => (s.id === slotId ? { ...s, [field]: time } : s)),
      };
    });
    onChange?.(next);
    setPickerVisible(false);
    setPickerTarget(null);
  };

  const applyPreset = (preset: Preset) => {
    if (readOnly) return;
    const next = value.map((d) => {
      if (!preset.days.includes(d.dayIndex)) return { ...d, enabled: false, slots: [] };
      return {
        ...d,
        enabled: true,
        slots: preset.slots.map((s) => ({ id: uid(), start: s.start, end: s.end })),
      };
    });
    onChange?.(next);
  };

  return (
    <View style={styles.container}>
      {/* Presets */}
      {!readOnly && (
        <View style={styles.presetsRow}>
          {PRESETS.map((p) => (
            <Pressable key={p.key} style={styles.presetChip} onPress={() => applyPreset(p)}>
              <Text style={styles.presetChipText}>{t(p.key)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Days */}
      {value.map((day) => (
        <View key={day.dayIndex} style={styles.dayRow}>
          <Pressable
            style={[styles.dayHeader, day.enabled && styles.dayHeaderActive]}
            onPress={() => toggleDay(day.dayIndex)}
            disabled={readOnly}
          >
            <Text style={[styles.dayLabel, day.enabled && styles.dayLabelActive]}>
              {t(DAY_KEYS[day.dayIndex])}
            </Text>
            {!readOnly && (
              <View style={[styles.dayToggle, day.enabled && styles.dayToggleActive]}>
                <View style={[styles.dayToggleThumb, day.enabled && styles.dayToggleThumbActive]} />
              </View>
            )}
          </Pressable>

          {day.enabled && day.slots.length > 0 && (
            <View style={styles.slotsWrap}>
              {day.slots.map((slot) => {
                const status = slotStatuses?.[slot.id];
                return (
                  <View key={slot.id} style={styles.slotRow}>
                    <Pressable
                      style={styles.slotTimeBtn}
                      onPress={() => openTimePicker(day.dayIndex, slot.id, "start", slot.start)}
                      disabled={readOnly}
                    >
                      <Text style={styles.slotTimeText}>{slot.start}</Text>
                    </Pressable>

                    <Text style={styles.slotDash}>–</Text>

                    <Pressable
                      style={styles.slotTimeBtn}
                      onPress={() => openTimePicker(day.dayIndex, slot.id, "end", slot.end)}
                      disabled={readOnly}
                    >
                      <Text style={styles.slotTimeText}>{slot.end}</Text>
                    </Pressable>

                    {status === "booked" && (
                      <View style={styles.bookedPill}>
                        <Text style={styles.bookedText}>{t("slotBooked")}</Text>
                      </View>
                    )}
                    {status === "pending" && (
                      <View style={styles.pendingPill}>
                        <Text style={styles.pendingText}>{t("slotPending")}</Text>
                      </View>
                    )}
                    {status === "available" && readOnly && (
                      <View style={styles.availablePill}>
                        <Text style={styles.availableText}>{t("slotAvailable")}</Text>
                      </View>
                    )}

                    {!readOnly && (
                      <Pressable style={styles.removeSlotBtn} onPress={() => removeSlot(day.dayIndex, slot.id)}>
                        <Text style={styles.removeSlotText}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
              {!readOnly && (
                <Pressable style={styles.addSlotBtn} onPress={() => addSlot(day.dayIndex)}>
                  <Text style={styles.addSlotText}>+ {t("addTimeSlot")}</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      ))}

      {!value.some((d) => d.enabled) && !readOnly && (
        <Text style={styles.emptyHint}>{t("scheduleEmptyHint")}</Text>
      )}

      <TimePicker
        visible={pickerVisible}
        title={
          pickerTarget?.field === "start"
            ? t("selectStartTime")
            : t("selectEndTime")
        }
        initial={pickerInitial}
        onConfirm={onTimeConfirm}
        onCancel={() => {
          setPickerVisible(false);
          setPickerTarget(null);
        }}
      />
    </View>
  );
}
