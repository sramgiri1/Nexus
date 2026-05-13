import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nexus-theme";
const VALID_THEMES = new Set(["system", "dark", "light"]);

function canUseWindow() {
  return typeof window !== "undefined";
}

function readLocalStorageTheme() {
  if (!canUseWindow()) return "system";

  try {
    const value = window.localStorage?.getItem(STORAGE_KEY);
    return VALID_THEMES.has(value) ? value : "system";
  } catch {
    return "system";
  }
}

function resolveSystemPreference() {
  if (!canUseWindow() || typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getStoredNexusTheme() {
  return readLocalStorageTheme();
}

export function resolveNexusTheme(theme = "system") {
  if (theme === "dark" || theme === "light") {
    return theme;
  }

  return resolveSystemPreference();
}

export function applyNexusTheme(theme = "system", resolvedTheme = resolveNexusTheme(theme)) {
  if (!canUseWindow()) return;

  const root = document.documentElement;
  root.setAttribute("data-nexus-theme", theme);
  root.setAttribute("data-nexus-resolved-theme", resolvedTheme);
}

export function useNexusTheme() {
  const [theme, setThemeState] = useState(() => getStoredNexusTheme());
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveNexusTheme(getStoredNexusTheme()));

  useEffect(() => {
    const nextResolvedTheme = resolveNexusTheme(theme);
    setResolvedTheme(nextResolvedTheme);
    applyNexusTheme(theme, nextResolvedTheme);

    if (!canUseWindow()) return undefined;

    try {
      window.localStorage?.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures and continue with in-memory state.
    }

    if (theme !== "system" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const systemResolvedTheme = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(systemResolvedTheme);
      applyNexusTheme("system", systemResolvedTheme);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [theme]);

  const api = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme(nextTheme) {
      setThemeState(VALID_THEMES.has(nextTheme) ? nextTheme : "system");
    },
    cycleTheme() {
      setThemeState((currentTheme) => {
        if (currentTheme === "system") return "dark";
        if (currentTheme === "dark") return "light";
        return "system";
      });
    },
    isSystem: theme === "system",
    isDark: resolvedTheme === "dark",
    isLight: resolvedTheme === "light",
  }), [theme, resolvedTheme]);

  return api;
}
