import { ConfirmActionModal } from '../ServiceRequests/ConfirmActionModal';

interface ArchiveConversationModalProps {
    open: boolean;
    isLoading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function ArchiveConversationModal({ open, isLoading, onConfirm, onClose }: ArchiveConversationModalProps) {
    return <ConfirmActionModal open={open} title="Arquivar conversa?" description="Depois de arquivada, esta conversa deixa de aceitar novas mensagens e anexos." confirmLabel="Arquivar conversa" destructive isLoading={isLoading} onConfirm={onConfirm} onClose={onClose} />;
}
