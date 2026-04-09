# GitHub Copilot Instructions — OlxReversed

## Project Overview

OlxReversed is a **reverse marketplace** app: buyers post service/product *requests*, and sellers browse and send *offers*. Built with React Native + Expo, backed by Supabase.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81, Expo ~54 |
| Navigation | Expo Router ~6 (file-based) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Gestures | `react-native-gesture-handler` — `ReanimatedSwipeable` |
| Animations | `react-native-reanimated` ~4 |
| Icons | `lucide-react-native` |
| i18n | `i18n-js` + custom `LanguageContext` |
| State | React Context (`AppContext`, `CurrencyContext`, `LanguageContext`) |

---

## File Conventions

- Every screen file (`app/**/*.tsx`) has a companion **styles file** (`*.styles.ts`). **Never inline styles** in screen files.
- `src/components/` — shared UI components
- `src/context/` — React contexts and hooks
- `src/i18n/translations.ts` — all translation strings (EN + RO)
- `src/lib/supabase.ts` — **single Supabase client export** (`supabase`). Never create a second client.
- `src/theme/` — colors, spacing, typography constants

---

## i18n — Translations

**Always use `useTranslation()`** for any user-visible string. Never hardcode English text.

```tsx
const t = useTranslation();
// ...
<Text>{t("someKey")}</Text>
```

When adding a new string:
1. Add the key to **both** `en` and `ro` objects in `src/i18n/translations.ts`
2. Use `t("yourKey")` in the component

Existing key groups: navigation, common, marketplace, request/offer flow, chat, offers screen, offer status, request detail, my offers, negotiation, profile, create/edit modals, filters, counter-offer modal, round/negotiation labels.

---

## Currency

**Always use `useCurrency()`** — never format prices manually.

```tsx
const { formatPrice } = useCurrency();
// ...
<Text>{formatPrice(Number(amount))}</Text>
```

- Prices stored in the DB as **RON** (Romanian Leu)
- Conversion rate: 1 EUR ≈ 5 RON
- User can toggle display currency; `formatPrice()` handles conversion and symbol

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
  created_at timestamptz DEFAULT now()
);

-- Buyer posts a request
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  category text,
  budget_min numeric,
  budget_max numeric,
  location text,
  status text DEFAULT 'open',   -- 'open' | 'negotiating' | 'matched' | 'closed'
  created_at timestamptz DEFAULT now()
);

-- Seller swipes right → sends an offer
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES profiles(id),
  price numeric NOT NULL,
  description text,
  status text DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at timestamptz DEFAULT now()
);

-- Buyer responds with a counter-offer
CREATE TABLE public.counter_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES offers(id) ON DELETE CASCADE,
  request_id uuid REFERENCES requests(id),
  buyer_id uuid REFERENCES profiles(id),
  price numeric NOT NULL,
  message text,
  status text DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
  created_at timestamptz DEFAULT now()
);

-- Swipe tracking (seller swiped right/left on a request)
CREATE TABLE public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  request_id uuid REFERENCES requests(id),
  direction text NOT NULL,  -- 'right' | 'left'
  created_at timestamptz DEFAULT now()
);

-- Chat messages between buyer and seller (unlocked after offer accepted)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id),
  sender_id uuid REFERENCES profiles(id),
  content text,
  created_at timestamptz DEFAULT now()
);
```

### Status Flows

**requests.status**: `open` → `negotiating` → `matched` → `closed`

**offers.status**: `pending` → `accepted` | `rejected` | `withdrawn`
- When a counter-offer is accepted: the *offer* is also set to `accepted` in the DB — but visually the offer should show as "rejected/countered" if there's an accepted counter. Use: `offerDisplayStatus = acceptedCounter ? "rejected" : offer.status`

**counter_offers.status**: `pending` → `accepted` | `rejected`

---

## Gesture Handling

Use `ReanimatedSwipeable` from `react-native-gesture-handler` for swipeable rows. Track the currently open row with `useRef<SwipeableMethods | null>`.

```tsx
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

const openSwipeRef = useRef<SwipeableMethods | null>(null);
```

Close before opening a new one to avoid multiple open swipeable rows.

---

## Date Formatting

**Never use bare `.toLocaleString()`** (it includes seconds). Always pass explicit options:

```ts
function formatDateTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
```

---

## Negotiation Thread (my-offers.tsx)

The seller sees a thread of rounds per request. Each round has:
- **Your Offer** block (blue) — swipeable (Edit / Withdraw)  
- **Counter Offer** block (amber) — buyer's response  

Rendering order: newest round on top. Within a round: counter on top, ↑ arrow, offer below.

Key state:
- `openThreads` — thread open/closed per request id
- `openOlderThreads` — older rounds expanded per request id
- `roundsToRender = olderRoundsOpen ? requestOffers : requestOffers.slice(0, 1)`
- `realIdx = olderRoundsOpen ? idx : 0` — keeps round labels correct when collapsed

"Accepted offer" summary line sits between the initial offer row and the negotiation toggle. Shows the accepted price (green) or "Pending decision" (muted italic) or is hidden when withdrawn.

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
