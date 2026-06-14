<?php

namespace App\Enums;

enum UserType: string
{
    case Client = 'client';
    case Professional = 'professional';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Client => 'Cliente',
            self::Professional => 'Profissional',
            self::Admin => 'Administrador',
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
