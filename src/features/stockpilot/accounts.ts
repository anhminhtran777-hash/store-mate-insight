import { useCallback, useEffect, useState } from "react";
import type { Role } from "./model";

/** Local test accounts. Browser-only demo credentials, not real security. */
export const accounts = [
  { username: "manager", password: "manager123", role: "Manager" as Role, name: "Demo Manager" },
  { username: "staff", password: "staff123", role: "Staff" as Role, name: "Demo Staff" },
] as const;
export type Account = (typeof accounts)[number];

export function findAccount(username: string, password: string): Account | undefined {
  const u = username.trim().toLowerCase().split("@")[0];
  return accounts.find((a) => a.username === u && a.password === password);
}

const CURRENT = "stockgenie:current-account";
const prefsKey = (u: string) => `stockgenie:prefs:${u}`;
const SHARED_STATE = "stockgenie:state:shared";
const legacyStateKey = (u: string) => `stockgenie:state:${u}`;
const EVENT = "stockgenie-prefs";
const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

export function getCurrentAccount(): Account | undefined {
  if (!hasStorage()) return undefined;
  const u = localStorage.getItem(CURRENT);
  return accounts.find((a) => a.username === u);
}
export function setCurrentAccount(username: string | null) {
  if (!hasStorage()) return;
  if (username) localStorage.setItem(CURRENT, username);
  else localStorage.removeItem(CURRENT);
  window.dispatchEvent(new Event(EVENT));
}
export function loadPrefs(): Record<string, unknown> {
  const acc = getCurrentAccount();
  if (!acc) return {};
  try {
    return JSON.parse(localStorage.getItem(prefsKey(acc.username)) ?? "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}
export function savePrefs(patch: Record<string, unknown>) {
  const acc = getCurrentAccount();
  if (!acc) return;
  localStorage.setItem(prefsKey(acc.username), JSON.stringify({ ...loadPrefs(), ...patch }));
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Load the shared inventory state, or null when none exists.
 * Stock is shared between the demo accounts so manager and staff stay in sync;
 * falls back to a legacy per-account save on first load after the change.
 */
export function loadStockState<T>(username: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw =
      localStorage.getItem(SHARED_STATE) ?? localStorage.getItem(legacyStateKey(username));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
export function saveStockState(_username: string, state: unknown) {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(SHARED_STATE, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: keep the demo running without persistence.
  }
}

/** Subscribe to saved-preference changes (sign-in, sign-out, edits). */
export function onPrefsChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

/** A value saved to the signed-in account; falls back to the default. */
export function usePref<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    const sync = () => setValue((loadPrefs()[key] as T | undefined) ?? fallback);
    sync();
    return onPrefsChange(sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((v: T) => { setValue(v); savePrefs({ [key]: v }); }, [key]);
  return [value, set];
}
