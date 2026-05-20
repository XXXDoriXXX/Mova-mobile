import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./locales/en.json";
import uk from "./locales/uk.json";

const SUPPORTED = ["uk", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED)[number];

function pickInitialLocale(): SupportedLocale {
  const locales = Localization.getLocales();
  const tag = locales[0]?.languageCode ?? "uk";
  return (SUPPORTED as readonly string[]).includes(tag)
    ? (tag as SupportedLocale)
    : "uk";
}

let initialized = false;

export function initI18n(): typeof i18n {
  if (initialized) return i18n;
  initialized = true;

  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.use(initReactI18next).init({
    resources: {
      uk: { translation: uk },
      en: { translation: en },
    },
    lng: pickInitialLocale(),
    fallbackLng: "uk",
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: "v4",
  });

  return i18n;
}

export default i18n;
