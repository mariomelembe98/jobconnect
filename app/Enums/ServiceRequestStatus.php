<?php

namespace App\Enums;

enum ServiceRequestStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case ReceivingProposals = 'receiving_proposals';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Rascunho',
            self::Published => 'Publicado',
            self::ReceivingProposals => 'A receber propostas',
            self::InProgress => 'Em progresso',
            self::Completed => 'Concluído',
            self::Cancelled => 'Cancelado',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
