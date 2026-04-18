import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "../context/LanguageContext";
import { styles } from "./SchedulePicker.styles";

// ── Types ────────────────────────────────────────────────────────────

export type TimeSlot = {
  id: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  date?: string; // "YYYY-MM-DD" — if set, this is a date-specific slot
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

/** Check if any slot in the schedule has a date */
function hasDatedSlots(week: WeekSchedule): boolean {
  return week.some((d) => d.slots.some((s) => !!s.date));
}

/** Format "YYYY-MM-DD" → short locale label like "Mon, Apr 20" */
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Group all dated slots into a flat list sorted by date */
function collectDatedSlots(
  week: WeekSchedule,
): { date: string; slot: TimeSlot; dayIndex: number }[] {
  const out: { date: string; slot: TimeSlot; dayIndex: number }[] = [];
  for (const day of week) {
    if (!day.enabled) continue;
    for (const slot of day.slots) {
      if (slot.date) {
        out.push({ date: slot.date, slot, dayIndex: day.dayIndex });
      }
    }
  }
  out.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return a.slot.start.localeCompare(b.slot.start);
  });
  return out;
}

// ── Quick presets ────────────────────────────────────────────────────

type Preset = {
  key: string;
  days: number[];
  slots: { start: string; end: string }[];
};

const PRESETS: Preset[] = [
  {
    key: "presetMornings",
    days: [0, 1, 2, 3, 4],
    slots: [{ start: "08:00", end: "12:00" }],
  },
  {
    key: "presetAfternoons",
    days: [0, 1, 2, 3, 4],
    slots: [{ start: "13:00", end: "17:00" }],
  },
  {
    key: "presetFullWeekdays",
    days: [0, 1, 2, 3, 4],
    slots: [{ start: "08:00", end: "17:00" }],
  },
  {
    key: "presetWeekends",
    days: [5, 6],
    slots: [{ start: "09:00", end: "15:00" }],
  },
  {
    key: "presetEvenings",
    days: [0, 1, 2, 3, 4],
    slots: [{ start: "18:00", end: "21:00" }],
  },
];

// ── Time picker ──────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

type TimePickerProps = {
  visible: boolean;
  title: string;
  initial: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
};

function TimePicker({
  visible,
  title,
  initial,
  onConfirm,
  onCancel,
}: TimePickerProps) {
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.pickerBackdrop} onPress={onCancel}>
        <Pressable
          style={styles.pickerCard}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.pickerTitle}>{title}</Text>

          {/* Hour grid */}
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
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
                  style={[
                    styles.pickerDigitBtn,
                    h === hour && styles.pickerDigitBtnActive,
                  ]}
                  onPress={() => setHour(h)}
                >
                  <Text style={styles.pickerDigitText}>{h}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Minute chips */}
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t("scheduleMinute")}
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {MINUTES.map((m) => (
                <Pressable
                  key={m}
                  style={[
                    styles.pickerDigitBtn,
                    { flex: 1 },
                    m === minute && styles.pickerDigitBtnActive,
                  ]}
                  onPress={() => setMinute(m)}
                >
                  <Text style={styles.pickerDigitText}>{m}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Preview */}
          <Text
            style={{
              textAlign: "center",
              fontSize: 28,
              fontWeight: "900",
              color: "#020617",
            }}
          >
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

// ── Calendar mini-view for date-specific schedules ───────────────────

const CAL_DAY_KEYS = [
  "mondayShort",
  "tuesdayShort",
  "wednesdayShort",
  "thursdayShort",
  "fridayShort",
  "saturdayShort",
  "sundayShort",
] as const;

function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type CalProps = {
  value: WeekSchedule;
  slotStatuses?: Record<string, "available" | "pending" | "booked">;
  t: (key: string) => string;
};

function ScheduleCalendar({ value, slotStatuses, t }: CalProps) {
  const dated = useMemo(() => collectDatedSlots(value), [value]);

  // Build a map: dateStr → slots
  const dateMap = useMemo(() => {
    const m = new Map<
      string,
      { slot: TimeSlot; status: "available" | "pending" | "booked" }[]
    >();
    for (const entry of dated) {
      const status = slotStatuses?.[entry.slot.id] ?? "available";
      if (!m.has(entry.date)) m.set(entry.date, []);
      m.get(entry.date)!.push({ slot: entry.slot, status });
    }
    return m;
  }, [dated, slotStatuses]);

  // Determine initial month from the first dated slot
  const firstDate =
    dated.length > 0 ? new Date(dated[0].date + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(firstDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(firstDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dated.length > 0 ? dated[0].date : null,
  );

  if (dated.length === 0) return null;

  const goBack = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goForward = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar grid
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday=0, convert from JS Sunday=0
  const startDow = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstOfMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Get best status for a date (booked > pending > available)
  const getDateStatus = (
    dateStr: string,
  ): "available" | "pending" | "booked" | null => {
    const slots = dateMap.get(dateStr);
    if (!slots) return null;
    if (slots.some((s) => s.status === "booked")) return "booked";
    if (slots.some((s) => s.status === "pending")) return "pending";
    return "available";
  };

  const selectedSlots = selectedDate ? (dateMap.get(selectedDate) ?? []) : [];

  return (
    <View style={styles.calWrap}>
      {/* Month nav */}
      <View style={styles.calHeader}>
        <Pressable onPress={goBack} style={styles.calNavBtn}>
          <Text style={styles.calNavText}>‹</Text>
        </Pressable>
        <Text style={styles.calMonthLabel}>{monthLabel}</Text>
        <Pressable onPress={goForward} style={styles.calNavBtn}>
          <Text style={styles.calNavText}>›</Text>
        </Pressable>
      </View>

      {/* Day-of-week header */}
      <View style={styles.calRow}>
        {CAL_DAY_KEYS.map((k) => (
          <View key={k} style={styles.calCell}>
            <Text style={styles.calDowLabel}>{t(k)}</Text>
          </View>
        ))}
      </View>

      {/* Day cells */}
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <View key={week} style={styles.calRow}>
          {cells.slice(week * 7, week * 7 + 7).map((day, ci) => {
            if (day === null) {
              return <View key={`e${ci}`} style={styles.calCell} />;
            }
            const dateStr = localISO(new Date(viewYear, viewMonth, day));
            const status = getDateStatus(dateStr);
            const isSelected = dateStr === selectedDate;

            return (
              <Pressable
                key={day}
                style={[
                  styles.calCell,
                  status !== null && styles.calCellHasSlots,
                  isSelected && styles.calCellSelected,
                ]}
                onPress={() => {
                  if (status !== null) setSelectedDate(dateStr);
                }}
              >
                <Text
                  style={[
                    styles.calDayText,
                    status !== null && styles.calDayTextActive,
                    isSelected && styles.calDayTextSelected,
                  ]}
                >
                  {day}
                </Text>
                {status !== null && (
                  <View
                    style={[
                      styles.calDot,
                      status === "booked" && styles.calDotBooked,
                      status === "pending" && styles.calDotPending,
                      status === "available" && styles.calDotAvailable,
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* Selected date details */}
      {selectedDate && selectedSlots.length > 0 && (
        <View style={styles.calDetail}>
          <Text style={styles.calDetailDate}>
            {formatDateLabel(selectedDate)}
          </Text>
          <View style={styles.readOnlySlots}>
            {selectedSlots.map(({ slot, status }) => (
              <View
                key={slot.id}
                style={[
                  styles.readOnlyChip,
                  status === "booked" && styles.readOnlyChipBooked,
                  status === "pending" && styles.readOnlyChipPending,
                ]}
              >
                <Text
                  style={[
                    styles.readOnlyChipText,
                    status === "booked" && styles.readOnlyChipTextBooked,
                    status === "pending" && styles.readOnlyChipTextPending,
                  ]}
                >
                  {slot.start} – {slot.end}
                </Text>
                {status === "booked" && (
                  <Text style={styles.readOnlyStatusText}>
                    {t("slotBooked")}
                  </Text>
                )}
                {status === "pending" && (
                  <Text style={styles.readOnlyStatusTextPending}>
                    {t("slotPending")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
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

export function SchedulePicker({
  value,
  onChange,
  readOnly,
  slotStatuses,
}: Props) {
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
          slots:
            enabled && d.slots.length === 0
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
        return {
          ...d,
          slots: [...d.slots, { id: uid(), start: newStart, end: newEnd }],
        };
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

  const openTimePicker = (
    dayIndex: number,
    slotId: string,
    field: "start" | "end",
    currentVal: string,
  ) => {
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
        slots: d.slots.map((s) =>
          s.id === slotId ? { ...s, [field]: time } : s,
        ),
      };
    });
    onChange?.(next);
    setPickerVisible(false);
    setPickerTarget(null);
  };

  const applyPreset = (preset: Preset) => {
    if (readOnly) return;
    const next = value.map((d) => {
      if (!preset.days.includes(d.dayIndex))
        return { ...d, enabled: false, slots: [] };
      return {
        ...d,
        enabled: true,
        slots: preset.slots.map((s) => ({
          id: uid(),
          start: s.start,
          end: s.end,
        })),
      };
    });
    onChange?.(next);
  };

  // ── Read-only compact chip layout ────────────────────────────────
  if (readOnly) {
    const activeDays = value.filter((d) => d.enabled && d.slots.length > 0);
    if (activeDays.length === 0) return null;

    // ── Date-specific display — calendar mini-view ────────────────
    if (hasDatedSlots(value)) {
      return (
        <ScheduleCalendar value={value} slotStatuses={slotStatuses} t={t} />
      );
    }

    // ── Weekday-only display (no dates — backward compat) ──────────
    return (
      <View style={styles.readOnlyWrap}>
        {activeDays.map((day) => (
          <View key={day.dayIndex} style={styles.readOnlyDay}>
            <Text style={styles.readOnlyDayLabel}>
              {t(DAY_KEYS[day.dayIndex])}
            </Text>
            <View style={styles.readOnlySlots}>
              {day.slots.map((slot) => {
                const status = slotStatuses?.[slot.id];
                return (
                  <View
                    key={slot.id}
                    style={[
                      styles.readOnlyChip,
                      status === "booked" && styles.readOnlyChipBooked,
                      status === "pending" && styles.readOnlyChipPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.readOnlyChipText,
                        status === "booked" && styles.readOnlyChipTextBooked,
                        status === "pending" && styles.readOnlyChipTextPending,
                      ]}
                    >
                      {slot.start} – {slot.end}
                    </Text>
                    {status === "booked" && (
                      <Text style={styles.readOnlyStatusText}>
                        {t("slotBooked")}
                      </Text>
                    )}
                    {status === "pending" && (
                      <Text style={styles.readOnlyStatusTextPending}>
                        {t("slotPending")}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }

  // ── Editable mode ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Presets */}
      <View style={styles.presetsRow}>
        {PRESETS.map((p) => (
          <Pressable
            key={p.key}
            style={styles.presetChip}
            onPress={() => applyPreset(p)}
          >
            <Text style={styles.presetChipText}>{t(p.key)}</Text>
          </Pressable>
        ))}
      </View>

      {/* Days */}
      {value.map((day) => (
        <View key={day.dayIndex} style={styles.dayRow}>
          <Pressable
            style={[styles.dayHeader, day.enabled && styles.dayHeaderActive]}
            onPress={() => toggleDay(day.dayIndex)}
          >
            <Text
              style={[styles.dayLabel, day.enabled && styles.dayLabelActive]}
            >
              {t(DAY_KEYS[day.dayIndex])}
            </Text>
            <View
              style={[styles.dayToggle, day.enabled && styles.dayToggleActive]}
            >
              <View
                style={[
                  styles.dayToggleThumb,
                  day.enabled && styles.dayToggleThumbActive,
                ]}
              />
            </View>
          </Pressable>

          {day.enabled && day.slots.length > 0 && (
            <View style={styles.slotsWrap}>
              {day.slots.map((slot) => (
                <View key={slot.id} style={styles.slotRow}>
                  <Pressable
                    style={styles.slotTimeBtn}
                    onPress={() =>
                      openTimePicker(day.dayIndex, slot.id, "start", slot.start)
                    }
                  >
                    <Text style={styles.slotTimeText}>{slot.start}</Text>
                  </Pressable>

                  <Text style={styles.slotDash}>–</Text>

                  <Pressable
                    style={styles.slotTimeBtn}
                    onPress={() =>
                      openTimePicker(day.dayIndex, slot.id, "end", slot.end)
                    }
                  >
                    <Text style={styles.slotTimeText}>{slot.end}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.removeSlotBtn}
                    onPress={() => removeSlot(day.dayIndex, slot.id)}
                  >
                    <Text style={styles.removeSlotText}>✕</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                style={styles.addSlotBtn}
                onPress={() => addSlot(day.dayIndex)}
              >
                <Text style={styles.addSlotText}>+ {t("addTimeSlot")}</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}

      {!value.some((d) => d.enabled) && (
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
