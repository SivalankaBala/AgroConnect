import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { SUPPORTED_LANGUAGES, translations, getNestedTranslation } from "../i18n/translations";

const STORAGE_KEY = "agroconnect_language";
const DEFAULT_LANG = "en";

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["en", "te", "hi"].includes(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn("Could not read language from localStorage", e);
    }
    return DEFAULT_LANG;
  });

  const changeLanguage = useCallback((newLang) => {
    if (!["en", "te", "hi"].includes(newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn("Could not save language to localStorage", e);
    }
  }, []);

  // Synchronize document attributes whenever language changes
  useEffect(() => {
    document.documentElement.lang = language;

    // Apply language-specific class for font targeting if desired
    document.documentElement.classList.remove("lang-en", "lang-te", "lang-hi");
    document.documentElement.classList.add(`lang-${language}`);

    // Update document title and meta description
    const currentMeta = translations[language]?.meta || translations.en.meta;
    if (currentMeta?.title) {
      document.title = currentMeta.title;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && currentMeta?.description) {
      metaDesc.setAttribute("content", currentMeta.description);
    }
  }, [language]);

  const t = useCallback(
    (path, params = {}) => {
      return getNestedTranslation(language, path, params);
    },
    [language]
  );

  const getCropDisplayTag = useCallback(
    (name = "", category = "") => {
      const lower = name.toLowerCase();
      const tags = translations[language]?.cropTags || translations.en.cropTags;

      if (lower.includes("sona masoori") || lower.includes("rice") || lower.includes("paddy") || lower.includes("వరి") || lower.includes("धान")) {
        return tags.sonaMasoori;
      }
      if (lower.includes("chilli") || lower.includes("mirchi") || lower.includes("మిరప") || lower.includes("మిర్చి") || lower.includes("मिर्च")) {
        return tags.chilli;
      }
      if (lower.includes("maize") || lower.includes("corn") || lower.includes("మొక్కజొన్న") || lower.includes("मक्का")) {
        return tags.maize;
      }
      if (lower.includes("tomato") || lower.includes("టమోటా") || lower.includes("टमाटर")) {
        return tags.tomato;
      }
      if (lower.includes("groundnut") || lower.includes("peanut") || lower.includes("వేరుశనగ") || lower.includes("मूंगफली")) {
        return tags.groundnut;
      }
      if (lower.includes("turmeric") || lower.includes("పసుపు") || lower.includes("हल्दी")) {
        return tags.turmeric;
      }
      if (lower.includes("wheat") || lower.includes("గోధుమ") || lower.includes("गेहूं")) {
        return tags.wheat;
      }
      if (lower.includes("onion") || lower.includes("ఉల్లి") || lower.includes("प्याज")) {
        return tags.onion;
      }

      if (category === "Grains") return tags.grains;
      if (category === "Vegetables") return tags.vegetables;
      if (category === "Spices") return tags.spices;
      if (category === "Pulses & Nuts") return tags.pulses;

      return tags.default;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage: changeLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
      getCropDisplayTag
    }),
    [language, changeLanguage, t, getCropDisplayTag]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
