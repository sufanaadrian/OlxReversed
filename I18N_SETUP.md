# Internationalization (i18n) Setup

## Overview

This app now supports both English (`en`) and Romanian (`ro`) languages with automatic device language detection and persistence.

## How to Use

### For Users

1. **Automatic Detection**: The app automatically detects your device's language and loads English or Romanian accordingly.
2. **Manual Language Switch**: Go to **Profile → Language** to toggle between English 🇬🇧 and Română 🇷🇴
3. **Persistence**: Your language choice is saved and will be remembered when you reopen the app.

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
- ✅ Tabs Navigation
- ⏳ Marketplace (next)
- ⏳ My Requests (next)
- ⏳ Create Request (next)
- ⏳ Chat (next)

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
- **`src/i18n/index.ts`** - i18n configuration & device language detection
- **`src/context/LanguageContext.tsx`** - React Context for language state & switching
- **`app/_layout.tsx`** - Wraps entire app with LanguageProvider

## Current Translations Supported

- Navigation tabs
- Profile settings
- Common UI elements (buttons, labels, status messages)
- Months and dates
- Offer/request workflow

## Testing

**To test language switching:**

1. Run the app
2. Go to Profile
3. Click 🇷🇴 Română or 🇬🇧 English
4. Observe all hardcoded strings update instantly

**Device Language Detection:**

- If device is set to Romanian → Shows Romanian
- If device is set to any other language → Shows English
- User can override in settings

## Next Steps

Gradually update all remaining screens to use `t("key")` instead of hardcoded strings.
