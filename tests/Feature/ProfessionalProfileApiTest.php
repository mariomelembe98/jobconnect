<?php

use App\Enums\UserType;
use App\Models\Category;
use App\Models\ProfessionalProfile;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('professional can create profile', function () {
    $user = professionalApiUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/professional/profile', professionalProfilePayload());

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Perfil profissional criado com sucesso.')
        ->assertJsonPath('data.profile.user_id', $user->id)
        ->assertJsonPath('data.profile.headline', 'Técnico Sénior de Informática');

    $this->assertDatabaseHas('professional_profiles', [
        'user_id' => $user->id,
        'headline' => 'Técnico Sénior de Informática',
        'city' => 'KaMpfumo',
    ]);
});

test('professional cannot create duplicate profile', function () {
    $user = professionalApiUser();
    ProfessionalProfile::factory()->for($user)->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/professional/profile', professionalProfilePayload());

    $response
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Já existe um perfil profissional para este utilizador.');
});

test('professional can fetch profile', function () {
    $user = professionalApiUser();
    $profile = ProfessionalProfile::factory()->for($user)->create([
        'headline' => 'Canalizador Certificado',
    ]);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/professional/profile');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Perfil profissional carregado com sucesso.')
        ->assertJsonPath('data.profile.id', $profile->id)
        ->assertJsonPath('data.profile.headline', 'Canalizador Certificado');
});

test('professional can update profile', function () {
    $user = professionalApiUser();
    ProfessionalProfile::factory()->for($user)->create();
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/professional/profile', [
        'headline' => 'Especialista em Redes',
        'bio' => 'Profissional com experiência comprovada em redes empresariais e suporte técnico.',
        'experience_years' => 9,
        'base_price' => 2500,
        'price_type' => 'hourly',
        'province' => 'Maputo Cidade',
        'city' => 'Nhlamankulu',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Perfil profissional actualizado com sucesso.')
        ->assertJsonPath('data.profile.headline', 'Especialista em Redes')
        ->assertJsonPath('data.profile.experience_years', 9);

    $this->assertDatabaseHas('professional_profiles', [
        'user_id' => $user->id,
        'headline' => 'Especialista em Redes',
        'experience_years' => 9,
    ]);
});

test('professional can assign categories', function () {
    $user = professionalApiUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    $categories = Category::factory()->count(2)->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/professional/categories', [
        'category_ids' => $categories->pluck('id')->all(),
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Categorias profissionais actualizadas com sucesso.')
        ->assertJsonCount(2, 'data.profile.categories');

    foreach ($categories as $category) {
        $this->assertDatabaseHas('professional_categories', [
            'professional_profile_id' => $profile->id,
            'category_id' => $category->id,
        ]);
    }
});

test('professional can assign skills', function () {
    $user = professionalApiUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    $skills = Skill::factory()->count(3)->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/professional/skills', [
        'skill_ids' => $skills->pluck('id')->all(),
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Competências profissionais actualizadas com sucesso.')
        ->assertJsonCount(3, 'data.profile.skills');

    foreach ($skills as $skill) {
        $this->assertDatabaseHas('professional_skills', [
            'professional_profile_id' => $profile->id,
            'skill_id' => $skill->id,
        ]);
    }
});

test('professional can update availability', function () {
    $user = professionalApiUser();
    ProfessionalProfile::factory()->for($user)->create();
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/professional/availability', [
        'availability' => 'away',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Disponibilidade actualizada com sucesso.')
        ->assertJsonPath('data.profile.availability', 'away');

    $this->assertDatabaseHas('professional_profiles', [
        'user_id' => $user->id,
        'availability' => 'away',
    ]);
});

test('client cannot access professional profile routes', function (string $method, string $uri, array $payload) {
    $user = clientApiUser();
    Sanctum::actingAs($user);

    $response = $this->json($method, $uri, $payload);

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a profissionais.');
})->with([
    ['POST', '/api/v1/professional/profile', professionalProfilePayload()],
    ['GET', '/api/v1/professional/profile', []],
    ['PATCH', '/api/v1/professional/profile', ['headline' => 'Título novo']],
    ['POST', '/api/v1/professional/categories', ['category_ids' => [1]]],
    ['POST', '/api/v1/professional/skills', ['skill_ids' => [1]]],
    ['PATCH', '/api/v1/professional/availability', ['availability' => 'busy']],
]);

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function professionalProfilePayload(array $overrides = []): array
{
    return [
        'headline' => 'Técnico Sénior de Informática',
        'bio' => 'Profissional experiente em suporte técnico, redes e manutenção de sistemas empresariais.',
        'experience_years' => 8,
        'base_price' => 1500,
        'price_type' => 'fixed',
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        'address' => 'Avenida 25 de Setembro',
        'latitude' => -25.9667,
        'longitude' => 32.5833,
        ...$overrides,
    ];
}

function professionalApiUser(): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
    ]);
    $user->assignRole('professional');

    return $user;
}

function clientApiUser(): User
{
    Role::findOrCreate('client');

    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
    ]);
    $user->assignRole('client');

    return $user;
}
