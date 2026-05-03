# GitHub Copilot Instructions — OlxReversed

## Project Overview

OlxReversed is a **student jobs marketplace**: employers post job _requests_, students browse and send _offers_ (applications). Built with React Native + Expo, backed by Supabase. Users can register as `student`, `employer`, or `both`, and switch between marketplace modes.

---

## Tech Stack

| Layer      | Technology                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| Framework  | React Native 0.81.5, Expo ~54.0.31                                                                           |
| Navigation | Expo Router ~6.0.21 (file-based)                                                                             |
| Backend    | Supabase ^2.90.1 (PostgreSQL + Auth + Realtime)                                                              |
| Gestures   | `react-native-gesture-handler` ~2.28.0 — `ReanimatedSwipeable`                                               |
| Animations | `react-native-reanimated` ~4.1.1                                                                             |
| Icons      | `lucide-react-native` ^0.562.0                                                                               |
| i18n       | `i18n-js` ^4.5.3 + custom `LanguageContext`                                                                  |
| State      | React Context (`AppContext`, `CurrencyContext`, `LanguageContext`, `ThemeContext`, `MarketplaceModeContext`) |

---

## File Conventions

- Every screen file (`app/**/*.tsx`) has a companion **styles file** (`*.styles.ts`). **Never inline styles** in screen files.
- Styles files export a `makeStyles(colors: Colors)` factory so styles react to the current theme.
- `src/components/` — shared UI components
- `src/context/` — React contexts and hooks
- `src/i18n/translations.ts` — all translation strings (EN + RO)
- `src/lib/supabase.ts` — **single Supabase client export** (`supabase`). Never create a second client.
- `src/theme/` — colors (light + dark palettes), spacing, typography constants
- `src/data/` — static data: `jobTypes.ts`, `mockData.ts`

---

## Navigation — Tab Structure

5-tab bottom bar + center modal action button:

| Tab         | File                     | Description                       |
| ----------- | ------------------------ | --------------------------------- |
| Marketplace | `(tabs)/marketplace.tsx` | Browse job posts                  |
| Activity    | `(tabs)/activity.tsx`    | Pending applicants (badge)        |
| +(modal)    | `(tabs)/__plus__.tsx`    | Post Job / Browse menu            |
| Messages    | `(tabs)/messages.tsx`    | Chat conversations (unread badge) |
| Profile     | `(tabs)/profile.tsx`     | Profile, settings, work history   |

Hidden from tab bar (accessible via Activity):

- `(tabs)/my-requests.tsx` — My posted jobs
- `(tabs)/my-offers.tsx` — My sent applications

---

## Contexts

### ThemeContext

```tsx
const { colors, isDark, toggleTheme } = useTheme();
```

- Light/dark mode stored in AsyncStorage
- Always pass `colors` from `useTheme()` to `makeStyles(colors)` in screen files

### MarketplaceModeContext

```tsx
const { mode, setMode } = useMarketplaceMode(); // 'all' | 'employer' | 'student'
```

- Defaults to the user's registered `user_type`
- Controls which jobs are shown in the marketplace

### CurrencyContext

```tsx
const { formatPrice } = useCurrency();
<Text>{formatPrice(Number(amount))}</Text>;
```

- Prices stored as **RON** in the DB; `formatPrice()` converts to EUR when toggled
- Conversion rate: 1 EUR ≈ 5 RON; never format prices manually

### LanguageContext

```tsx
const t = useTranslation();
<Text>{t("someKey")}</Text>;
```

- Default language: Romanian (`ro`)
- Never hardcode user-visible strings

---

## i18n — Translations

**Always use `useTranslation()`** for any user-visible string. Never hardcode English text.

When adding a new string:

1. Add the key to **both** `en` and `ro` objects in `src/i18n/translations.ts`
2. Use `t("yourKey")` in the component

Existing key groups: navigation, common, categories, job posting, application/offers, offer status, chat, profile/settings, saved jobs, reviews/ratings, schedule types, availability tags, date/time labels.

---

## Color System

Use `colors` from `useTheme()` — never hardcode hex values. Key semantic tokens:

| Token             | Light              | Dark      |
| ----------------- | ------------------ | --------- |
| `colors.primary`  | `#0D9488` (teal)   | `#2DD4BF` |
| `colors.accent`   | `#F97316` (orange) | `#FB923C` |
| `colors.success`  | `#10B981`          | `#34D399` |
| `colors.warning`  | `#F59E0B`          | `#FBBF24` |
| `colors.error`    | `#EF4444`          | `#F87171` |
| `colors.employer` | `#7C3AED`          | `#C084FC` |

**Offer status display colors:**

- Pending: `colors.warning` (amber)
- Accepted (invited to chat): `colors.success` (green)
- Hired (confirmed): `colors.primary` (teal)
- Rejected: `colors.error` (red)
- Withdrawn: `colors.textMuted` (gray)

---

## Supabase

### Client Usage

```ts
import { supabase } from "@/src/lib/supabase";
```

Never call `createClient()` again anywhere else.

### Key Tables & Schema

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text,
  avatar_url text,
  university text,
  study_year text,
  bio text,
  skills text[],
  user_type text DEFAULT 'student',  -- 'student' | 'employer' | 'both'
  onboarding_completed boolean DEFAULT false,
  cv_url text,
  verified boolean DEFAULT false,
  linkedin_url text,
  phone_number text,
  created_at timestamptz DEFAULT now()
);

-- Job postings (employers post jobs, students can also post availability)
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  category text,
  budget_min numeric,
  budget_max numeric,
  location text,
  posting_as text DEFAULT 'employer',        -- 'employer' | 'student'
  type text,
  status text DEFAULT 'active',              -- 'active' | 'filled' | 'closed'
  is_urgent boolean DEFAULT false,
  is_boosted boolean DEFAULT false,
  boosted_until timestamptz,
  screening_note text,
  workers_needed integer DEFAULT 1,
  accepted_count integer DEFAULT 0,
  job_type text,
  schedule_type text,                        -- 'full-time' | 'part-time' | 'weekend' | 'seasonal' | 'remote' | 'flexible'
  rate_type text,                            -- 'hourly' | 'per-session' | 'per-project' | 'daily' | 'negotiable'
  availability_tags text[],
  close_reason text,                         -- 'completed' | 'cancelled'
  matched_offer_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Applications (student applies to a job post)
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES profiles(id),
  price numeric,
  cover_letter text,
  description text,
  status text DEFAULT 'pending',  -- 'pending' | 'accepted' | 'hired' | 'rejected' | 'withdrawn'
  created_at timestamptz DEFAULT now()
);

-- Swipe / interest tracking
CREATE TABLE public.request_swipes (
  user_id uuid REFERENCES profiles(id),
  request_id uuid REFERENCES requests(id),
  direction text NOT NULL,  -- 'right' | 'left'
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, request_id)
);

-- Lightweight interest signal (no cover letter)
CREATE TABLE public.job_interests (
  user_id uuid REFERENCES profiles(id),
  request_id uuid REFERENCES requests(id),
  created_at timestamptz DEFAULT now()
);

-- Chat messages (unlocked after offer accepted)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id),
  sender_id uuid REFERENCES profiles(id),
  content text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Saved/bookmarked jobs
CREATE TABLE public.saved_jobs (
  user_id uuid REFERENCES profiles(id),
  request_id uuid REFERENCES requests(id),
  created_at timestamptz DEFAULT now()
);

-- Post-completion reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid REFERENCES profiles(id),
  reviewee_id uuid REFERENCES profiles(id),
  request_id uuid REFERENCES requests(id),
  offer_id uuid REFERENCES offers(id),
  rating integer CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Saved searches / job alerts
CREATE TABLE public.job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  category text,
  keyword text,
  location text,
  created_at timestamptz DEFAULT now()
);
```

### Status Flows

**requests.status**: `active` → `filled` | `closed`

- Set `matched_offer_id` and increment `accepted_count` when an applicant is hired
- `accepted_count >= workers_needed` → auto-fill or prompt to mark `filled`

**offers.status**: `pending` → `accepted` → `hired` | `rejected` | `withdrawn`

- `accepted` = employer invited the applicant to chat (not yet final)
- `hired` = employer confirmed hire after chatting (final; increments `accepted_count`)
- When marking `hired`: update `offers.status = 'hired'` AND increment `requests.accepted_count`

---

## Gesture Handling

Use `ReanimatedSwipeable` from `react-native-gesture-handler` for swipeable rows. Track the currently open row with `useRef<SwipeableMethods | null>`.

```tsx
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

const openSwipeRef = useRef<SwipeableMethods | null>(null);
```

Close before opening a new one to avoid multiple open swipeable rows.

---

## Animations

Use `LayoutAnimation` before state changes that cause layout shifts:

```ts
import { LayoutAnimation, UIManager, Platform } from "react-native";

// Android setup (once, in root layout or context)
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// Before any state change that shifts layout
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
```

---

## Date Formatting

**Never use bare `.toLocaleString()`** (it includes seconds). Always pass explicit options:

```ts
function formatDateTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

---

## My Applications Screen (my-offers.tsx)

Two tabs: **Sent** (applications I submitted) and **Received** (applicants on my posts).

- Sent tab: grouped by job post; shows status badge, cover letter, price
- Received tab: shows applicant profile (bio, skills, linkedin, verified badge), accept/reject/hire actions
- Rate experience flow appears after `hired` status on completed jobs

---

## What NOT to Do

- **Do not** create a second Supabase client — import `supabase` from `src/lib/supabase.ts`
- **Do not** hardcode user-visible strings — always use `t("key")`
- **Do not** format prices manually — always use `formatPrice()`
- **Do not** use bare `.toLocaleString()` — use explicit date options (no seconds)
- **Do not** add inline styles to screen files — use companion `*.styles.ts`
- **Do not** use `StyleSheet.create` in screen `.tsx` files
- **Do not** add translation key to only one language — always add to both `en` and `ro`
- **Do not** add comments or docstrings to code you didn't change

---

## Development Commands

```bash
# Start dev server
npx expo start

# iOS
npx expo start --ios

# Android
npx expo start --android

# Lint
npx expo lint
```
