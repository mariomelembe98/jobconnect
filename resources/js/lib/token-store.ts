export const AUTH_TOKEN_KEY = 'proconnect_token';
export const AUTH_USER_KEY = 'proconnect_user';

export interface TokenStore {
    get(): string | null;
    set(token: string): void;
    clear(): void;
}

export const browserTokenStore: TokenStore = {
    get: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(AUTH_TOKEN_KEY)),
    set: (token) => window.localStorage.setItem(AUTH_TOKEN_KEY, token),
    clear: () => window.localStorage.removeItem(AUTH_TOKEN_KEY),
};
