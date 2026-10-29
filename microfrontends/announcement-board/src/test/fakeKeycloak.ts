import { act } from 'react';
import { vi } from 'vitest';
import type { KeycloakInstance } from '../auth/keycloak';

/** Installs a fake shared Keycloak adapter, as Entando would on window.entando.keycloak. */
export async function signIn(overrides: Partial<KeycloakInstance> = {}) {
  const keycloak = {
    authenticated: true,
    token: 'token-1',
    tokenParsed: { preferred_username: 'alice' },
    updateToken: vi.fn<KeycloakInstance['updateToken']>().mockResolvedValue(false),
    login: vi.fn(),
    ...overrides,
  };
  await act(async () => {
    window.entando = { ...window.entando, keycloak };
    window.dispatchEvent(new CustomEvent('keycloak', { detail: { eventType: 'onAuthSuccess' } }));
  });
  return keycloak;
}

export async function signedOut() {
  const keycloak = {
    authenticated: false,
    updateToken: vi.fn<KeycloakInstance['updateToken']>().mockRejectedValue(new Error('not signed in')),
    login: vi.fn(),
  };
  await act(async () => {
    window.entando = { ...window.entando, keycloak };
    window.dispatchEvent(new CustomEvent('keycloak', { detail: { eventType: 'onAuthLogout' } }));
  });
  return keycloak;
}

export function removeKeycloak() {
  delete window.entando;
}
