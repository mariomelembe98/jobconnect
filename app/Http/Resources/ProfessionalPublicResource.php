<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessionalPublicResource extends JsonResource
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
            'headline' => $this->headline,
            'bio' => $this->bio,
            'experience_years' => $this->experience_years,
            'base_price' => $this->base_price,
            'price_type' => $this->price_type,
            'province' => $this->province,
            'city' => $this->city,
            'verification_status' => $this->verification_status?->value,
            'availability' => $this->availability?->value,
            'average_rating' => $this->average_rating,
            'total_reviews' => $this->total_reviews,
            'user' => [
                'id' => $this->whenLoaded('user', fn () => $this->user->id),
                'name' => $this->whenLoaded('user', fn () => $this->user->name),
                'avatar' => $this->whenLoaded('user', fn () => $this->user->avatar),
            ],
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'skills' => SkillResource::collection($this->whenLoaded('skills')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
