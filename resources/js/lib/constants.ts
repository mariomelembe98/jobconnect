export const APP_NAME = import.meta.env.VITE_APP_NAME && import.meta.env.VITE_APP_NAME !== 'Laravel'
    ? import.meta.env.VITE_APP_NAME
    : 'ProConnect';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const USER_TYPE_LABELS = {
    client: 'Cliente',
    professional: 'Profissional',
    admin: 'Administrador',
} as const;

export const STATUS_LABELS: Record<string, string> = {
    active: 'Activo',
    blocked: 'Bloqueado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
    disputed: 'Em disputa',
    draft: 'Rascunho',
    inactive: 'Inactivo',
    in_progress: 'Em progresso',
    pending: 'Pendente',
    published: 'Publicado',
    receiving_proposals: 'A receber propostas',
    resolved: 'Resolvido',
    reviewing: 'Em análise',
    suspended: 'Suspenso',
    under_review: 'Em análise',
};

export const MOZAMBIQUE_PROVINCES = [
    'Maputo Cidade',
    'Maputo Província',
    'Gaza',
    'Inhambane',
    'Sofala',
    'Manica',
    'Tete',
    'Zambézia',
    'Nampula',
    'Cabo Delgado',
    'Niassa',
] as const;
