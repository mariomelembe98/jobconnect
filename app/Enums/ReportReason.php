<?php

namespace App\Enums;

enum ReportReason: string
{
    case Fraud = 'fraud';
    case Abuse = 'abuse';
    case FakeProfile = 'fake_profile';
    case InappropriateContent = 'inappropriate_content';
    case ServiceNotDelivered = 'service_not_delivered';
    case Spam = 'spam';
    case Other = 'other';

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
