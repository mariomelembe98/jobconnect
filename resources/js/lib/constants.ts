export const APP_NAME = import.meta.env.VITE_APP_NAME && import.meta.env.VITE_APP_NAME !== 'Laravel'
    ? import.meta.env.VITE_APP_NAME
    : 'ProConnect';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const USER_TYPE_LABELS = {
    client: 'Cliente',
    professional: 'Profissional',
    admin: 'Administrador',
    super_admin: 'Super administrador',
} as const;

export const STATUS_LABELS: Record<string, string> = {
    accepted: 'Aceite',
    active: 'Activo',
    blocked: 'Bloqueado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
    declined: 'Recusado',
    disputed: 'Em disputa',
    draft: 'Rascunho',
    expired: 'Expirada',
    inactive: 'Inactivo',
    in_progress: 'Em progresso',
    pending: 'Pendente',
    published: 'Publicado',
    receiving_proposals: 'A receber propostas',
    rejected: 'Rejeitada',
    resolved: 'Resolvido',
    reviewing: 'Em análise',
    suspended: 'Suspenso',
    under_review: 'Em análise',
    withdrawn: 'Retirada',
};

export const REPORT_REASON_LABELS: Record<string, string> = {
    fraud: 'Fraude',
    abuse: 'Abuso',
    fake_profile: 'Perfil falso',
    inappropriate_content: 'Conteúdo impróprio',
    service_not_delivered: 'Serviço não entregue',
    spam: 'Spam',
    other: 'Outro',
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
    user: 'Utilizador',
    professional: 'Profissional',
    service_request: 'Pedido de serviço',
    contract: 'Contrato',
    message: 'Mensagem',
    review: 'Avaliação',
};

export const DISPUTE_RESOLUTION_LABELS: Record<string, string> = {
    favor_client: 'A favor do cliente',
    favor_professional: 'A favor do profissional',
    mutual_agreement: 'Acordo mútuo',
    dismissed: 'Descartada',
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
