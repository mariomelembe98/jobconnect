<?php

namespace App\Enums;

enum AvailabilityStatus: string
{
    case Available = 'available';
    case Busy = 'busy';
    case Away = 'away';
    case Vacation = 'vacation';
    case Unavailable = 'unavailable';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Disponível',
            self::Busy => 'Ocupado',
            self::Away => 'Ausente',
            self::Vacation => 'De férias',
            self::Unavailable => 'Indisponível',
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
