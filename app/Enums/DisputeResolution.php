<?php

namespace App\Enums;

enum DisputeResolution: string
{
    case FavorClient = 'favor_client';
    case FavorProfessional = 'favor_professional';
    case MutualAgreement = 'mutual_agreement';
    case Dismissed = 'dismissed';

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
