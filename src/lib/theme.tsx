/**
 * Theme management for Sphere.
 *
 * The actual color flip is driven by a single `dark` class on <html>:
 *   - Light: no class
 *   - Dark:  <html class="dark"> (this triggers the .dark { } block in
 *            src/styles.css, which inverts --paper/--ink/--line/--mute/--surface)
 *
 * Three modes: 'light' | 'dark' | 'system'. Persisted in localStorage under
 * "sphere.theme". When in 'system', we listen to prefers-color-scheme.
 */

import * as React from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "sphere.theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export function resolveEffectiveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const effective = resolveEffectiveTheme(mode);
  const root = document.documentElement;
  root.classList.toggle("dark", effective === "dark");
}

interface ThemeContextValue {
  mode: ThemeMode;
  effective: "light" | "dark";
  setMode: (next: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>(() => getStoredTheme());
  const [effective, setEffective] = React.useState<"light" | "dark">(() =>
    resolveEffectiveTheme(mode),
  );

  // Apply on every mode change.
  React.useEffect(() => {
    applyTheme(mode);
    setEffective(resolveEffectiveTheme(mode));
  }, [mode]);

  // When in 'system', live-react to OS-level changes.
  React.useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme("system");
      setEffective(resolveEffectiveTheme("system"));
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = React.useCallback((next: ThemeMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / quota — fine, just don't persist */
    }
    setModeState(next);
  }, []);

  const toggle = React.useCallback(() => {
    setMode(effective === "dark" ? "light" : "dark");
  }, [effective, setMode]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ mode, effective, setMode, toggle }),
    [mode, effective, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    // Allow components to call useTheme() outside the provider during SSR /
    // early boot — return a safe stub so we never crash.
    return {
      mode: "system",
      effective: "light",
      setMode: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}

/**
 * Inline script that runs before React hydrates, so the correct theme class
 * is set on <html> before first paint (no flash of wrong theme).
 * Inject into <head> via dangerouslySetInnerHTML.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var k = "${STORAGE_KEY}";
    var v = localStorage.getItem(k);
    var dark =
      v === "dark" ||
      ((!v || v === "system") &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;
