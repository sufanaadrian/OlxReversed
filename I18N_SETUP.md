# Internationalization (i18n) Setup

## Overview

This app supports both English (`en`) and Romanian (`ro`) languages with persistence across sessions.

## How to Use

### For Users

1. **Manual Language Switch**: Go to **Profile → Language** to toggle between English 🇬🇧 and Română 🇷🇴
2. **Persistence**: Your language choice is saved and will be remembered when you reopen the app.
3. **Default Language**: Romanian (`ro`) is the default on first launch.

### For Developers

#### Adding a New Translation

1. **Add the key to both languages** in `src/i18n/translations.ts`:

```typescript
export const translations = {
  en: {
    myNewString: "Hello World",
  },
  ro: {
    myNewString: "Salut Lume",
  },
};
```

2. **Use it in any component**:

```tsx
import { useTranslation } from "../../src/context/LanguageContext";

function MyComponent() {
  const t = useTranslation();

  return <Text>{t("myNewString")}</Text>;
}
```

#### Supported Screens (Already Updated)

- ✅ Profile Screen
- ✅ Tabs Navigation (`_layout.tsx`)
- ✅ Marketplace
- ✅ My Requests
- ✅ My Offers
- ✅ Create Request
- ✅ Create Offer
- ✅ Counter Offer
- ✅ Edit Offer
- ✅ Chat
- ✅ Request Detail
- ✅ Offers List
- ✅ Filters
- ✅ Sign In

#### To Update More Screens

Follow this pattern:

```tsx
// 1. Import the hook
import { useTranslation } from "../../src/context/LanguageContext";

// 2. Use in component
const t = useTranslation();

// 3. Replace hardcoded strings
<Text>{t("translationKey")}</Text>;
```

## Architecture

- **`src/i18n/translations.ts`** - All translation strings (English & Romanian)
- **`src/i18n/index.ts`** - i18n configuration (singleton, defaults to `"ro"`)
- **`src/context/LanguageContext.tsx`** - React Context for language state & switching
- **`src/context/CurrencyContext.tsx`** - React Context for currency state (RON/EUR)
- **`app/_layout.tsx`** - Wraps entire app with `LanguageProvider` and `CurrencyProvider`

## Current Translations Supported

- Navigation tabs
- Profile settings and auth
- Common UI elements (buttons, labels, status messages)
- Months and dates
- Offer/request workflow (create, edit, counter-offer)
- Marketplace (swipe cards, categories, filters)
- Chat screen
- All alert dialogs

## Testing

**To test language switching:**

1. Run the app
2. Go to Profile
3. Click 🇷🇴 Română or 🇬🇧 English
4. Observe all strings update instantly
