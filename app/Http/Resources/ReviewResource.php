<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
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
            'contract_id' => $this->contract_id,
            'reviewer_id' => $this->reviewer_id,
            'reviewed_id' => $this->reviewed_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'contract' => $this->whenLoaded('contract', function (): array {
                return [
                    'id' => $this->contract->id,
                    'status' => $this->contract->status?->value,
                    'service_request_id' => $this->contract->service_request_id,
                ];
            }),
            'reviewer' => $this->whenLoaded('reviewer', function (): array {
                return [
                    'id' => $this->reviewer->id,
                    'name' => $this->reviewer->name,
                    'avatar' => $this->reviewer->avatar,
                ];
            }),
            'reviewed' => $this->whenLoaded('reviewed', function (): array {
                return [
                    'id' => $this->reviewed->id,
                    'name' => $this->reviewed->name,
                    'avatar' => $this->reviewed->avatar,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
