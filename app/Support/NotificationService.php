<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function create(User $user, string $type, string $title, ?string $body = null, array $data = []): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    public function markAsRead(Notification $notification): void
    {
        if ($notification->read_at === null) {
            $notification->update([
                'read_at' => now(),
            ]);
        }
    }

    public function markAllAsRead(User $user): void
    {
        $user->notifications()
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);
    }
}
