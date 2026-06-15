<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractStatusLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'old_status' => $this->old_status,
            'new_status' => $this->new_status,
            'note' => $this->note,
            'changed_by' => $this->whenLoaded('changedBy', function (): array {
                return [
                    'id' => $this->changedBy->id,
                    'name' => $this->changedBy->name,
                    'avatar' => $this->changedBy->avatar,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
