<?php

namespace App\Enums;

enum ReportType: string
{
    case User = 'user';
    case ServiceRequest = 'service_request';
    case Contract = 'contract';
    case Message = 'message';
    case Review = 'review';

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
