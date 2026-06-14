<?php

namespace Database\Factories;

use App\Enums\AvailabilityStatus;
use App\Enums\VerificationStatus;
use App\Models\ProfessionalProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProfessionalProfile>
 */
class ProfessionalProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->professional(),
            'headline' => fake()->sentence(4),
            'bio' => fake()->paragraph(),
            'experience_years' => fake()->numberBetween(0, 25),
            'base_price' => fake()->randomFloat(2, 500, 50000),
            'price_type' => fake()->randomElement(['fixed', 'hourly', 'negotiable']),
            'province' => 'Maputo Cidade',
            'city' => 'KaMpfumo',
            'address' => fake()->streetAddress(),
            'latitude' => fake()->latitude(-26.0, -10.0),
            'longitude' => fake()->longitude(30.0, 41.0),
            'verification_status' => VerificationStatus::Pending,
            'availability' => AvailabilityStatus::Available,
            'average_rating' => 0,
            'total_reviews' => 0,
        ];
    }
}
