import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { getAccessToken, useAuth } from './keycloak';
import { removeKeycloak, signIn, signedOut } from '../test/fakeKeycloak';

afterEach(removeKeycloak);

describe('shared Keycloak access', () => {
  it('has no token when Keycloak is missing or signed out', async () => {
    expect(await getAccessToken()).toBeUndefined();
    await signedOut();
    expect(await getAccessToken()).toBeUndefined();
  });

  it('refreshes tokens close to expiry, or always when forced', async () => {
    const keycloak = await signIn();
    expect(await getAccessToken()).toBe('token-1');
    expect(keycloak.updateToken).toHaveBeenLastCalledWith(30);
    await getAccessToken(true);
    expect(keycloak.updateToken).toHaveBeenLastCalledWith(-1);
  });

  it('treats a failed refresh as signed out', async () => {
    await signIn({ updateToken: () => Promise.reject(new Error('refresh failed')) });
    expect(await getAccessToken()).toBeUndefined();
  });

  it('re-renders on keycloak events', async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toEqual({ available: false, authenticated: false, username: undefined });

    await signIn();
    expect(result.current).toEqual({ available: true, authenticated: true, username: 'alice' });

    await act(async () => signedOut());
    expect(result.current.authenticated).toBe(false);
  });
});
