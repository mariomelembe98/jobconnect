<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FavoriteResource extends JsonResource
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
            'professional_profile' => $this->whenLoaded('professionalProfile', function (): array {
                return [
                    'id' => $this->professionalProfile->id,
                    'headline' => $this->professionalProfile->headline,
                    'availability' => $this->professionalProfile->availability?->value,
                    'verification_status' => $this->professionalProfile->verification_status?->value,
                    'average_rating' => $this->professionalProfile->average_rating,
                    'user' => [
                        'id' => $this->professionalProfile->user?->id,
                        'name' => $this->professionalProfile->user?->name,
                        'avatar' => $this->professionalProfile->user?->avatar,
                        'status' => $this->professionalProfile->user?->status?->value,
                    ],
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
