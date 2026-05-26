"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import api from "@/lib/api";

export interface Language {
  code: string;
  name: string;
  flag: string;
}

type Translations = Record<string, unknown>;

interface I18nContextValue {
  lang: string;
  setLang: (code: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languages: Language[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "cf_lang";
const DEFAULT_LANG = "en";

function getInitialLang(): string {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const browser = navigator.language;
  // Exact match first, then prefix match (e.g. "en-US" → "en")
  return browser;
}

function getNestedValue(obj: Translations, keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>(DEFAULT_LANG);
  const [translations, setTranslations] = useState<Translations>({});
  const [languages, setLanguages] = useState<Language[]>([]);

  // Fetch available languages once
  useEffect(() => {
    api.get<Language[]>("/i18n/languages")
      .then((r) => setLanguages(r.data))
      .catch(() => {});
  }, []);

  const loadTranslations = useCallback(async (code: string, availableLangs: Language[]) => {
    // Determine best matching code
    const exactMatch = availableLangs.find((l) => l.code === code);
    const prefixMatch = availableLangs.find((l) => l.code === code.split("-")[0]);
    const resolved = exactMatch?.code ?? prefixMatch?.code ?? DEFAULT_LANG;

    try {
      const res = await api.get<Translations>(`/i18n/${resolved}`);
      setTranslations(res.data);
      setLangState(resolved);
      localStorage.setItem(STORAGE_KEY, resolved);
    } catch {
      // Fallback: try default lang
      if (resolved !== DEFAULT_LANG) {
        try {
          const fallback = await api.get<Translations>(`/i18n/${DEFAULT_LANG}`);
          setTranslations(fallback.data);
          setLangState(DEFAULT_LANG);
          localStorage.setItem(STORAGE_KEY, DEFAULT_LANG);
        } catch {}
      }
    }
  }, []);

  // Load translations when languages are ready
  useEffect(() => {
    if (languages.length === 0) return;
    const initial = getInitialLang();
    loadTranslations(initial, languages);
  }, [languages, loadTranslations]);

  const setLang = useCallback((code: string) => {
    loadTranslations(code, languages);
  }, [languages, loadTranslations]);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const keys = key.split(".");
    const value = getNestedValue(translations, keys);
    if (typeof value === "string") return interpolate(value, vars);
    return key;
  }, [translations]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
