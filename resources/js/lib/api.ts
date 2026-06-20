import { API_BASE_URL } from './constants';
import type { ApiEnvelope } from '../types';

export interface TokenStore {
    get(): string | null;
    set(token: string): void;
    clear(): void;
}

export const browserTokenStore: TokenStore = {
    get: () => (typeof window === 'undefined' ? null : window.sessionStorage.getItem('proconnect_token')),
    set: (token) => window.sessionStorage.setItem('proconnect_token', token),
    clear: () => window.sessionStorage.removeItem('proconnect_token'),
};

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly errors: Record<string, string[]> = {},
        public readonly isNetworkError = false,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
    query?: Record<string, string | number | boolean | null | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
    const params = new URLSearchParams();

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });

    const queryString = params.toString();
    return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
}

class TempoApiClient {
    constructor(private readonly tokenStore: TokenStore) {}

    get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
        return this.request<T>(path, { ...options, method: 'GET' });
    }

    post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
        return this.request<T>(path, { ...options, method: 'POST', body });
    }

    patch<T>(path: string, body: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
        return this.request<T>(path, { ...options, method: 'PATCH', body });
    }

    delete<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
        return this.request<T>(path, { ...options, method: 'DELETE' });
    }

    private async request<T>(path: string, { body, query, headers, ...init }: RequestOptions): Promise<T> {
        const token = this.tokenStore.get();
        const isFormData = body instanceof FormData;
        const requestHeaders = new Headers(headers);
        requestHeaders.set('Accept', 'application/json');

        if (!isFormData && body !== undefined) requestHeaders.set('Content-Type', 'application/json');
        if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

        let response: Response;

        try {
            response = await fetch(buildUrl(path, query), {
                ...init,
                headers: requestHeaders,
                body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
            });
        } catch {
            throw new ApiError('Não foi possível ligar ao servidor.', 0, {}, true);
        }

        const payload = (await response.json()) as ApiEnvelope<T>;

        if (!response.ok || !payload.success) {
            if (response.status === 401) this.tokenStore.clear();
            throw new ApiError(payload.message, response.status, payload.success ? {} : payload.errors);
        }

        return payload.data;
    }
}

export const api = new TempoApiClient(browserTokenStore);
