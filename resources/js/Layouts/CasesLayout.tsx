import type { ReactNode } from 'react';

import { ClientLayout } from './ClientLayout';
import { ProfessionalLayout } from './ProfessionalLayout';
import { getStoredAuthUser } from '../lib/auth';

interface CasesLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function CasesLayout(props: CasesLayoutProps) {
    const userType = getStoredAuthUser()?.user_type;

    if (userType === 'professional') {
        return <ProfessionalLayout {...props} />;
    }

    return <ClientLayout {...props} />;
}
