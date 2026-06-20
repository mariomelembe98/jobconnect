import type { ReactNode } from 'react';

import { AppLayout, type NavigationItem } from './AppLayout';

const navigation: NavigationItem[] = [
    { label: 'Visão geral', href: '/professional', icon: 'home' },
    { label: 'Oportunidades', href: '#', icon: 'search' },
    { label: 'Propostas', href: '#', icon: 'file' },
    { label: 'Contratos', href: '#', icon: 'briefcase' },
    { label: 'Mensagens', href: '#', icon: 'chat', badge: '2' },
    { label: 'Perfil profissional', href: '#', icon: 'user' },
];

interface ProfessionalLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function ProfessionalLayout(props: ProfessionalLayoutProps) {
    return <AppLayout {...props} navigation={navigation} sectionLabel="Área profissional" />;
}
