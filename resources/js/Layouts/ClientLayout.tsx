import type { ReactNode } from 'react';

import { AppLayout, type NavigationItem } from './AppLayout';
import { Button } from '../Components/ui/Button';
import { LoadingSkeleton } from '../Components/ui/LoadingSkeleton';
import { useProtectedSession } from '../lib/auth';

const navigation: NavigationItem[] = [
    { label: 'Visão geral', href: '/client', icon: 'home' },
    { label: 'Meus pedidos', href: '#', icon: 'file' },
    { label: 'Profissionais', href: '#', icon: 'search' },
    { label: 'Contratos', href: '/contracts', icon: 'briefcase' },
    { label: 'Mensagens', href: '/conversations', icon: 'chat' },
    { label: 'Notificações', href: '/notifications', icon: 'bell' },
    { label: 'Perfil', href: '#', icon: 'user' },
];

interface ClientLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function ClientLayout(props: ClientLayoutProps) {
    const { currentUser, isCheckingSession, isLoggingOut, logout } = useProtectedSession(['client']);

    if (isCheckingSession) {
        return (
            <div className="grid min-h-screen place-items-center bg-surface px-6">
                <div className="grid w-full max-w-sm gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                    <div className="flex items-center gap-3">
                        <LoadingSkeleton className="size-11 rounded-2xl" />
                        <div className="grid flex-1 gap-2">
                            <LoadingSkeleton className="h-4 w-24" />
                            <LoadingSkeleton className="h-3 w-36" />
                        </div>
                    </div>
                    <LoadingSkeleton className="h-12 w-full rounded-xl" />
                    <LoadingSkeleton className="h-12 w-full rounded-xl" />
                    <p className="text-center text-sm text-slate-500">A carregar a sua área de trabalho...</p>
                </div>
            </div>
        );
    }

    return (
        <AppLayout
            {...props}
            navigation={navigation}
            sectionLabel="Área do cliente"
            accountName={currentUser?.name}
            actions={
                <div className="flex items-center gap-2">
                    {props.actions}
                    <Button variant="outline" size="sm" onClick={logout} isLoading={isLoggingOut}>
                        Sair
                    </Button>
                </div>
            }
        />
    );
}
