<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DisputeMessageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dispute_id' => $this->dispute_id,
            'sender_id' => $this->sender_id,
            'message' => $this->message,
            'sender' => $this->whenLoaded('sender', fn (): array => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'avatar' => $this->sender->avatar,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
