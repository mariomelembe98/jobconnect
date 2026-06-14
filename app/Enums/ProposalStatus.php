<?php

namespace App\Enums;

enum ProposalStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendente',
            self::Accepted => 'Aceite',
            self::Rejected => 'Rejeitada',
            self::Withdrawn => 'Retirada',
            self::Expired => 'Expirada',
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
