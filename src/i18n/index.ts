import { translations } from "./translations";

// Simple i18n wrapper - no external dependencies
class I18n {
  locale: string = "ro";
  translations = translations;

  t(key: string): string {
    const keys = key.split(".");
    let value: any =
      this.translations[this.locale as keyof typeof translations];

    for (const k of keys) {
      value = value?.[k];
    }

    if (!value) {
      // Fallback to English if key not found
      value = this.translations.en;
      for (const k of keys) {
        value = value?.[k];
      }
    }

    return value || key;
  }
}

export default new I18n();
