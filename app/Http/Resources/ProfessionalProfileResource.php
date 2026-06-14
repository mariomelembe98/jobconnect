<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessionalProfileResource extends JsonResource
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
            'user_id' => $this->user_id,
            'headline' => $this->headline,
            'bio' => $this->bio,
            'experience_years' => $this->experience_years,
            'base_price' => $this->base_price,
            'price_type' => $this->price_type,
            'location' => [
                'province' => $this->province,
                'city' => $this->city,
                'address' => $this->address,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
            ],
            'verification_status' => $this->verification_status?->value,
            'availability' => $this->availability?->value,
            'average_rating' => $this->average_rating,
            'total_reviews' => $this->total_reviews,
            'user' => new UserResource($this->whenLoaded('user')),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'skills' => SkillResource::collection($this->whenLoaded('skills')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
