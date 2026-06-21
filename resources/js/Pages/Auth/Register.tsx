import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '../../Components/ui/Button';
import { Input } from '../../Components/ui/Input';
import { AuthLayout } from '../../Layouts/AuthLayout';
import { ApiError, api } from '../../lib/api';
import { getDashboardPath, saveAuthSession } from '../../lib/auth';
import { cn } from '../../lib/utils';
import type { User } from '../../types';

interface RegisterFormState {
    name: string;
    email: string;
    phone: string;
    user_type: 'client' | 'professional';
    password: string;
    password_confirmation: string;
}

type FieldErrors = Record<string, string[]>;

function firstFieldError(errors: FieldErrors, field: string): string | undefined {
    return errors[field]?.[0];
}

export default function Register() {
    const [role, setRole] = useState<'client' | 'professional'>('client');
    const [form, setForm] = useState<RegisterFormState>({
        name: '',
        email: '',
        phone: '',
        user_type: 'client',
        password: '',
        password_confirmation: '',
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

        const payload = {
            name: form.name,
            email: form.email.trim() ? form.email.trim() : null,
            phone: form.phone,
            user_type: role,
            password: form.password,
            password_confirmation: form.password_confirmation,
        };

        try {
            const response = await api.post<{ token: string; user: User }>('/auth/register', payload);
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
                setMessage('Não foi possível criar a conta. Tente novamente.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthLayout title="Crie a sua conta" description="Comece hoje a contratar serviços ou a encontrar novas oportunidades.">
            <Head title="Criar conta" />
            <form className="grid gap-5" onSubmit={handleSubmit}>
                {message ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                        {message}
                    </div>
                ) : null}
                <fieldset className="grid gap-2">
                    <legend className="text-sm font-medium text-slate-700">Como pretende usar a plataforma?</legend>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: 'client' as const, label: 'Contratar', detail: 'Procuro serviços' },
                            { value: 'professional' as const, label: 'Trabalhar', detail: 'Presto serviços' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={cn('rounded-xl border p-3 text-left transition', role === option.value ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-50' : 'border-slate-200 hover:border-slate-300')}
                                onClick={() => {
                                    setRole(option.value);
                                    setForm((current) => ({ ...current, user_type: option.value }));
                                }}
                            >
                                <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                                <span className="mt-0.5 block text-xs text-slate-500">{option.detail}</span>
                            </button>
                        ))}
                    </div>
                </fieldset>
                <input type="hidden" name="user_type" value={role} />
                <Input
                    name="name"
                    label="Nome completo"
                    placeholder="O seu nome"
                    autoComplete="name"
                    value={form.name}
                    error={firstFieldError(fieldErrors, 'name')}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                        name="phone"
                        type="tel"
                        label="Telefone"
                        placeholder="+258 84 000 0000"
                        autoComplete="tel"
                        value={form.phone}
                        error={firstFieldError(fieldErrors, 'phone')}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    />
                    <Input
                        name="email"
                        type="email"
                        label="Email (opcional)"
                        placeholder="email@exemplo.com"
                        autoComplete="email"
                        value={form.email}
                        error={firstFieldError(fieldErrors, 'email')}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                </div>
                <Input
                    name="password"
                    type="password"
                    label="Palavra-passe"
                    placeholder="Mínimo de 8 caracteres"
                    autoComplete="new-password"
                    value={form.password}
                    error={firstFieldError(fieldErrors, 'password')}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
                <Input
                    name="password_confirmation"
                    type="password"
                    label="Confirmar palavra-passe"
                    placeholder="Repita a palavra-passe"
                    autoComplete="new-password"
                    value={form.password_confirmation}
                    error={firstFieldError(fieldErrors, 'password_confirmation')}
                    onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                />
                <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <input type="checkbox" required className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Aceito os termos de utilização e a política de privacidade.
                </label>
                <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                    {isSubmitting ? 'A criar conta...' : 'Criar a minha conta'}
                </Button>
            </form>
            {hasErrors ? <p className="mt-4 text-sm text-slate-500">Corrija os campos assinalados antes de continuar.</p> : null}
            <p className="mt-7 text-center text-sm text-slate-500">
                Já tem uma conta?{' '}
                <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">Entrar</Link>
            </p>
        </AuthLayout>
    );
}
