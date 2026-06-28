
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import spanishLang from "./es_ES.json";
import englishLang from "./en_US.json";

export const normalizeLng = (lng: string) => {
  switch (lng) {
    case "en-US":
    case "en_US":
      return "en_US";
    case "es-ES":
    case "es_ES":
      return "es_ES";
    default:
      return "en_US";
  }
};

// List of supported languages
export const availableLanguages = [
  { lang: "en_US", name: "English (EE.UU.)" },
  { lang: "es_ES", name: "Español (España)" },
];

// Helper to get cached language securely without crashing on server-side rendering
const getInitialLanguage = (): string => {
  if (typeof window !== "undefined") {
    const match = document.cookie.match(new RegExp("(^| )i18nextLng=([^;]+)"));
    if (match) return match[2];
    return navigator.language;
  }
  return "en_US";
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en_US: { translation: englishLang },
      es_ES: { translation: spanishLang },
    },
    fallbackLng: "en_US",
    detection: {
      order: ["cookie", "navigator", "htmlTag"],
      lookupCookie: "i18nextLng",
      caches: ["cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
    lng: normalizeLng(getInitialLanguage()),
  });

  