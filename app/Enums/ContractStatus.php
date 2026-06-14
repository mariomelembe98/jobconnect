<?php

namespace App\Enums;

enum ContractStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Disputed = 'disputed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendente',
            self::Active => 'Activo',
            self::Completed => 'Concluído',
            self::Cancelled => 'Cancelado',
            self::Disputed => 'Em disputa',
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
