import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import type { User, UserType } from '../types';
import { api, ApiError } from './api';
import { AUTH_USER_KEY, browserTokenStore } from './token-store';

export interface AuthSession {
    token: string;
    user: User;
}

export function getAuthToken(): string | null {
    return browserTokenStore.get();
}

export function setAuthToken(token: string): void {
    browserTokenStore.set(token);
}

export function clearAuthToken(): void {
    browserTokenStore.clear();
}

export function getStoredAuthUser(): User | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const payload = window.localStorage.getItem(AUTH_USER_KEY);

    if (!payload) {
        return null;
    }

    try {
        return JSON.parse(payload) as User;
    } catch {
        window.localStorage.removeItem(AUTH_USER_KEY);

        return null;
    }
}

export function setStoredAuthUser(user: User): void {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuthUser(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(AUTH_USER_KEY);
}

export function saveAuthSession(session: AuthSession): void {
    setAuthToken(session.token);
    setStoredAuthUser(session.user);
}

export function clearAuthSession(): void {
    clearAuthToken();
    clearStoredAuthUser();
}

export function isAdminUserType(userType: UserType | null | undefined): boolean {
    return userType === 'admin' || userType === 'super_admin';
}

export function getDashboardPath(userType: UserType | null | undefined): string {
    if (userType === 'professional') {
        return '/professional';
    }

    if (isAdminUserType(userType)) {
        return '/admin';
    }

    return '/client';
}

export async function loadCurrentAuthUser(force = false): Promise<User | null> {
    const storedUser = getStoredAuthUser();

    if (storedUser && !force) {
        return storedUser;
    }

    if (!getAuthToken()) {
        return null;
    }

    try {
        const response = await api.get<{ user: User }>('/auth/me');
        setStoredAuthUser(response.user);

        return response.user;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            clearAuthSession();
        }

        return null;
    }
}

export function useGuestSessionRedirect(): { isCheckingSession: boolean } {
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        let active = true;

        async function bootstrap() {
            const token = getAuthToken();

            if (!token) {
                if (active) {
                    setIsCheckingSession(false);
                }

                return;
            }

            const storedUser = getStoredAuthUser();

            if (storedUser) {
                if (active) {
                    router.visit(getDashboardPath(storedUser.user_type), {
                        replace: true,
                        preserveScroll: true,
                    });
                }

                return;
            }

            const user = await loadCurrentAuthUser(true);

            if (!active) {
                return;
            }

            if (user) {
                router.visit(getDashboardPath(user.user_type), {
                    replace: true,
                    preserveScroll: true,
                });
                return;
            }

            setIsCheckingSession(false);
        }

        void bootstrap();

        return () => {
            active = false;
        };
    }, []);

    return { isCheckingSession };
}

export function useProtectedSession(allowedTypes: ReadonlyArray<UserType>): {
    isCheckingSession: boolean;
    currentUser: User | null;
    isLoggingOut: boolean;
    logout: () => Promise<void>;
} {
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredAuthUser());
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const allowedTypesKey = allowedTypes.join('|');

    useEffect(() => {
        let active = true;

        async function bootstrap() {
            const token = getAuthToken();

            if (!token) {
                router.visit('/login', {
                    replace: true,
                    preserveScroll: true,
                });
                return;
            }

            const storedUser = getStoredAuthUser();

            if (storedUser) {
                if (!allowedTypes.includes(storedUser.user_type)) {
                    router.visit(getDashboardPath(storedUser.user_type), {
                        replace: true,
                        preserveScroll: true,
                    });
                    return;
                }

                if (active) {
                    setCurrentUser(storedUser);
                    setIsCheckingSession(false);
                }

                return;
            }

            if (active) {
                setCurrentUser(null);
            }
            setIsCheckingSession(false);
        }

        void bootstrap();

        return () => {
            active = false;
        };
    }, [allowedTypesKey]);

    async function logout() {
        setIsLoggingOut(true);

        try {
            await api.post('/auth/logout');
        } catch {
            // Sempre limpar a sessão local, mesmo que a chamada falhe.
        } finally {
            clearAuthSession();
            router.visit('/login', {
                replace: true,
                preserveScroll: true,
            });
        }
    }

    return { isCheckingSession, currentUser, isLoggingOut, logout };
}
