<?php

use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\Category;
use App\Models\ProfessionalProfile;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can list active professionals', function () {
    $profile = publicProfessionalProfile();

    $response = $this->getJson('/api/v1/professionals');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Profissionais carregados com sucesso.')
        ->assertJsonPath('data.professionals.0.id', $profile->id)
        ->assertJsonPath('data.professionals.0.user.name', $profile->user->name)
        ->assertJsonPath('data.pagination.per_page', 15);
});

test('inactive and suspended user professionals are not listed', function () {
    $activeProfile = publicProfessionalProfile();
    publicProfessionalProfile(['status' => UserStatus::Inactive]);
    publicProfessionalProfile(['status' => UserStatus::Suspended]);

    $response = $this->getJson('/api/v1/professionals');

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.professionals')
        ->assertJsonPath('data.professionals.0.id', $activeProfile->id);
});

test('can filter by category', function () {
    $matchingCategory = Category::factory()->create();
    $otherCategory = Category::factory()->create();
    $matchingProfile = publicProfessionalProfile();
    $otherProfile = publicProfessionalProfile();
    $matchingProfile->categories()->attach($matchingCategory);
    $otherProfile->categories()->attach($otherCategory);

    $response = $this->getJson("/api/v1/professionals?category_id={$matchingCategory->id}");

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.professionals')
        ->assertJsonPath('data.professionals.0.id', $matchingProfile->id);
});

test('can filter by skill', function () {
    $matchingSkill = Skill::factory()->create();
    $otherSkill = Skill::factory()->create();
    $matchingProfile = publicProfessionalProfile();
    $otherProfile = publicProfessionalProfile();
    $matchingProfile->skills()->attach($matchingSkill);
    $otherProfile->skills()->attach($otherSkill);

    $response = $this->getJson("/api/v1/professionals?skill_id={$matchingSkill->id}");

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.professionals')
        ->assertJsonPath('data.professionals.0.id', $matchingProfile->id);
});

test('can filter by city', function () {
    $matchingProfile = publicProfessionalProfile(profileOverrides: ['city' => 'Matola']);
    publicProfessionalProfile(profileOverrides: ['city' => 'Beira']);

    $response = $this->getJson('/api/v1/professionals?city=Matola');

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.professionals')
        ->assertJsonPath('data.professionals.0.id', $matchingProfile->id)
        ->assertJsonPath('data.professionals.0.city', 'Matola');
});

test('can filter verified professionals', function () {
    $verifiedProfile = publicProfessionalProfile(profileOverrides: [
        'verification_status' => VerificationStatus::Verified,
    ]);
    publicProfessionalProfile(profileOverrides: [
        'verification_status' => VerificationStatus::Pending,
    ]);

    $response = $this->getJson('/api/v1/professionals?verified=true');

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.professionals')
        ->assertJsonPath('data.professionals.0.id', $verifiedProfile->id)
        ->assertJsonPath('data.professionals.0.verification_status', 'verified');
});

test('can show professional details', function () {
    $category = Category::factory()->create();
    $skill = Skill::factory()->for($category)->create();
    $profile = publicProfessionalProfile(profileOverrides: [
        'headline' => 'Consultor de Tecnologia',
        'average_rating' => 4.75,
    ]);
    $profile->categories()->attach($category);
    $profile->skills()->attach($skill);

    $response = $this->getJson("/api/v1/professionals/{$profile->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Profissional carregado com sucesso.')
        ->assertJsonPath('data.professional.id', $profile->id)
        ->assertJsonPath('data.professional.headline', 'Consultor de Tecnologia')
        ->assertJsonPath('data.professional.user.name', $profile->user->name)
        ->assertJsonCount(1, 'data.professional.categories')
        ->assertJsonCount(1, 'data.professional.skills');
});

test('missing professional returns 404', function () {
    $response = $this->getJson('/api/v1/professionals/999999');

    $response
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Profissional não encontrado.');
});

/**
 * @param  array<string, mixed>  $userOverrides
 * @param  array<string, mixed>  $profileOverrides
 */
function publicProfessionalProfile(array $userOverrides = [], array $profileOverrides = []): ProfessionalProfile
{
    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
        ...$userOverrides,
    ]);

    return ProfessionalProfile::factory()->for($user)->create([
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        ...$profileOverrides,
    ]);
}
