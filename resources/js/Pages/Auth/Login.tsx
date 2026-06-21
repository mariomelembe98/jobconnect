import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '../../Components/ui/Button';
import { Input } from '../../Components/ui/Input';
import { AuthLayout } from '../../Layouts/AuthLayout';
import { ApiError, api } from '../../lib/api';
import { getDashboardPath, saveAuthSession } from '../../lib/auth';
import type { User } from '../../types';

interface LoginFormState {
    identifier: string;
    password: string;
}

type FieldErrors = Record<string, string[]>;

function firstFieldError(errors: FieldErrors, field: string): string | undefined {
    return errors[field]?.[0];
}

export default function Login() {
    const [form, setForm] = useState<LoginFormState>({
        identifier: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [message, setMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasErrors = useMemo(() => Object.keys(fieldErrors).length > 0, [fieldErrors]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setIsSubmitting(true);
        setFieldErrors({});
        setMessage(null);

        try {
            const response = await api.post<{ token: string; user: User }>('/auth/login', form);
            saveAuthSession(response);

            router.visit(getDashboardPath(response.user.user_type), {
                replace: true,
                preserveScroll: true,
            });
        } catch (error) {
            if (error instanceof ApiError) {
                setMessage(error.message);
                setFieldErrors(error.errors);
            } else {
                setMessage('Não foi possível iniciar sessão. Tente novamente.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthLayout title="Bem-vindo de volta" description="Entre na sua conta para continuar a gerir os seus serviços.">
            <Head title="Entrar" />
            <form className="grid gap-5" onSubmit={handleSubmit}>
                {message ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                        {message}
                    </div>
                ) : null}
                <Input
                    name="identifier"
                    type="text"
                    label="Email ou telefone"
                    placeholder="exemplo@email.com"
                    autoComplete="username"
                    value={form.identifier}
                    error={firstFieldError(fieldErrors, 'identifier')}
                    onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
                />
                <div className="grid gap-2">
                    <div className="flex items-center justify-end">
                        <button type="button" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Esqueceu a palavra-passe?</button>
                    </div>
                    <Input
                        name="password"
                        type="password"
                        label="Palavra-passe"
                        placeholder="Introduza a sua palavra-passe"
                        autoComplete="current-password"
                        value={form.password}
                        error={firstFieldError(fieldErrors, 'password')}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    />
                </div>
                <label className="flex items-center gap-3 text-sm text-slate-600">
                    <input type="checkbox" className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Manter sessão iniciada neste dispositivo
                </label>
                <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                    {isSubmitting ? 'A entrar...' : 'Entrar na plataforma'}
                </Button>
            </form>
            {hasErrors ? <p className="mt-4 text-sm text-slate-500">Corrija os campos assinalados antes de continuar.</p> : null}
            <p className="mt-7 text-center text-sm text-slate-500">
                Ainda não tem conta?{' '}
                <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">Criar conta</Link>
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-400 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
                Acesso protegido
            </div>
        </AuthLayout>
    );
}
