import { Head, Link } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button } from '../../Components/ui/Button';
import { Input } from '../../Components/ui/Input';
import { AuthLayout } from '../../Layouts/AuthLayout';

export default function Login() {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    return (
        <AuthLayout title="Bem-vindo de volta" description="Entre na sua conta para continuar a gerir os seus serviços.">
            <Head title="Entrar" />
            <form className="grid gap-5" onSubmit={handleSubmit}>
                <Input name="identifier" type="text" label="Email ou telefone" placeholder="exemplo@email.com" autoComplete="username" />
                <div className="grid gap-2">
                    <div className="flex items-center justify-end">
                        <button type="button" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Esqueceu a palavra-passe?</button>
                    </div>
                    <Input name="password" type="password" label="Palavra-passe" placeholder="Introduza a sua palavra-passe" autoComplete="current-password" />
                </div>
                <label className="flex items-center gap-3 text-sm text-slate-600">
                    <input type="checkbox" className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Manter sessão iniciada neste dispositivo
                </label>
                <Button type="submit" size="lg" className="w-full">Entrar na plataforma</Button>
            </form>
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
