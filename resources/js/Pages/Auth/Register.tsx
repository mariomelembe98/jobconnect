import { Head, Link } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';

import { Button } from '../../Components/ui/Button';
import { Input } from '../../Components/ui/Input';
import { AuthLayout } from '../../Layouts/AuthLayout';
import { cn } from '../../lib/utils';

export default function Register() {
    const [role, setRole] = useState<'client' | 'professional'>('client');

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <AuthLayout title="Crie a sua conta" description="Comece hoje a contratar serviços ou a encontrar novas oportunidades.">
            <Head title="Criar conta" />
            <form className="grid gap-5" onSubmit={handleSubmit}>
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
                                onClick={() => setRole(option.value)}
                            >
                                <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                                <span className="mt-0.5 block text-xs text-slate-500">{option.detail}</span>
                            </button>
                        ))}
                    </div>
                </fieldset>
                <input type="hidden" name="user_type" value={role} />
                <Input name="name" label="Nome completo" placeholder="O seu nome" autoComplete="name" />
                <div className="grid gap-5 sm:grid-cols-2">
                    <Input name="phone" type="tel" label="Telefone" placeholder="+258 84 000 0000" autoComplete="tel" />
                    <Input name="email" type="email" label="Email (opcional)" placeholder="email@exemplo.com" autoComplete="email" />
                </div>
                <Input name="password" type="password" label="Palavra-passe" placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
                <Input name="password_confirmation" type="password" label="Confirmar palavra-passe" placeholder="Repita a palavra-passe" autoComplete="new-password" />
                <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <input type="checkbox" required className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Aceito os termos de utilização e a política de privacidade.
                </label>
                <Button type="submit" size="lg" className="w-full">Criar a minha conta</Button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-500">
                Já tem uma conta?{' '}
                <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">Entrar</Link>
            </p>
        </AuthLayout>
    );
}
