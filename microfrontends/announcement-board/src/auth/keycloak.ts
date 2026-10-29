import { useSyncExternalStore } from 'react';

/** The subset of the keycloak-js adapter that the widgets use. */
export interface KeycloakInstance {
  authenticated?: boolean;
  token?: string;
  tokenParsed?: { preferred_username?: string };
  updateToken(minValidity: number): Promise<boolean>;
  login(options?: { redirectUri?: string }): unknown;
}

declare global {
  interface Window {
    entando?: { keycloak?: KeycloakInstance; [key: string]: unknown };
  }
}

/**
 * Entando initialises one Keycloak adapter per page and shares it on
 * window.entando.keycloak; state changes are announced with "keycloak" window
 * events. The widgets never initialise Keycloak themselves.
 */
export function getKeycloak(): KeycloakInstance | undefined {
  return window.entando?.keycloak;
}

/** A fresh access token, or undefined when signed out or the refresh failed. */
export async function getAccessToken(forceRefresh = false): Promise<string | undefined> {
  const keycloak = getKeycloak();
  if (!keycloak?.authenticated) {
    return undefined;
  }
  try {
    // -1 forces a refresh; otherwise refresh only if it expires within 30 s.
    await keycloak.updateToken(forceRefresh ? -1 : 30);
  } catch {
    return undefined;
  }
  return keycloak.token;
}

export function login(): void {
  getKeycloak()?.login();
}

export interface AuthState {
  available: boolean;
  authenticated: boolean;
  username?: string;
}

function snapshot(): string {
  const keycloak = getKeycloak();
  return JSON.stringify([Boolean(keycloak), Boolean(keycloak?.authenticated), keycloak?.tokenParsed?.preferred_username]);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('keycloak', onChange);
  return () => window.removeEventListener('keycloak', onChange);
}

/** Re-renders whenever the shared Keycloak instance signs in, out or refreshes. */
export function useAuth(): AuthState {
  const [available, authenticated, username] = JSON.parse(useSyncExternalStore(subscribe, snapshot)) as [
    boolean,
    boolean,
    string | null,
  ];
  return { available, authenticated, username: username ?? undefined };
}
