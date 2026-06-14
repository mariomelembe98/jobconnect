<?php

use App\Enums\AvailabilityStatus;
use App\Enums\VerificationStatus;
use App\Models\Category;
use App\Models\ProfessionalProfile;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user has professional profile relationship', function () {
    $user = User::factory()->create();

    $profile = $user->professionalProfile()->create(profileAttributes());

    expect($user->professionalProfile()->is($profile))->toBeTrue();
});

test('category has skills', function () {
    $category = Category::create(categoryAttributes());

    $skill = $category->skills()->create(skillAttributes());

    expect($category->skills()->first()->is($skill))->toBeTrue();
});

test('professional profile can attach categories', function () {
    $profile = ProfessionalProfile::create(profileAttributes([
        'user_id' => User::factory()->create()->id,
    ]));
    $category = Category::create(categoryAttributes());

    $profile->categories()->attach($category);

    expect($profile->categories()->first()->is($category))->toBeTrue();
});

test('professional profile can attach skills', function () {
    $profile = ProfessionalProfile::create(profileAttributes([
        'user_id' => User::factory()->create()->id,
    ]));
    $category = Category::create(categoryAttributes());
    $skill = Skill::create(skillAttributes([
        'category_id' => $category->id,
    ]));

    $profile->skills()->attach($skill);

    expect($profile->skills()->first()->is($skill))->toBeTrue();
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function categoryAttributes(array $overrides = []): array
{
    return [
        'name' => 'Informática',
        'slug' => 'informatica',
        'description' => 'Serviços de informática.',
        'icon' => 'laptop',
        'status' => 'active',
        ...$overrides,
    ];
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function skillAttributes(array $overrides = []): array
{
    return [
        'name' => 'Suporte técnico',
        'slug' => 'suporte-tecnico',
        'description' => 'Suporte técnico geral.',
        ...$overrides,
    ];
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function profileAttributes(array $overrides = []): array
{
    return [
        'headline' => 'Técnico de informática',
        'bio' => 'Profissional com experiência em suporte técnico.',
        'experience_years' => 5,
        'base_price' => 1500,
        'price_type' => 'fixed',
        'province' => 'Maputo',
        'city' => 'Maputo',
        'address' => 'Baixa',
        'latitude' => -25.9667,
        'longitude' => 32.5833,
        'verification_status' => VerificationStatus::Pending,
        'availability' => AvailabilityStatus::Available,
        'average_rating' => 0,
        'total_reviews' => 0,
        ...$overrides,
    ];
}
