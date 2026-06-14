<?php

use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('authenticated user can fetch profile', function () {
    $user = profileUser();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/users/me');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Perfil carregado com sucesso.')
        ->assertJsonPath('data.user.id', $user->id);
});

test('authenticated user can update profile', function () {
    $user = profileUser();
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/users/me', [
        'name' => 'Novo Nome',
        'email' => 'novo@example.com',
        'phone' => '+258840000101',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Perfil actualizado com sucesso.')
        ->assertJsonPath('data.user.name', 'Novo Nome')
        ->assertJsonPath('data.user.email', 'novo@example.com')
        ->assertJsonPath('data.user.phone', '+258840000101');

    $user->refresh();

    expect($user->name)->toBe('Novo Nome')
        ->and($user->email)->toBe('novo@example.com')
        ->and($user->phone)->toBe('+258840000101');
});

test('authenticated user can update location', function () {
    $user = profileUser();
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/users/me/location', [
        'province' => 'Maputo',
        'city' => 'Matola',
        'address' => 'Avenida Principal',
        'latitude' => -25.9622,
        'longitude' => 32.4589,
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Localização actualizada com sucesso.')
        ->assertJsonPath('data.location.province', 'Maputo')
        ->assertJsonPath('data.location.city', 'Matola')
        ->assertJsonPath('data.location.address', 'Avenida Principal')
        ->assertJsonPath('data.user.location.province', 'Maputo')
        ->assertJsonPath('data.user.location.city', 'Matola');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'province' => 'Maputo',
        'city' => 'Matola',
        'address' => 'Avenida Principal',
        'latitude' => '-25.96220000',
        'longitude' => '32.45890000',
    ]);
});

test('authenticated user can change password', function () {
    $user = profileUser();
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/users/me/password', [
        'current_password' => 'password123',
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Palavra-passe alterada com sucesso.');

    expect(Hash::check('new-password123', $user->refresh()->password))->toBeTrue();
});

test('unauthenticated requests are rejected', function (string $method, string $uri) {
    $response = $this->json($method, $uri);

    $response
        ->assertUnauthorized()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não autenticado.');
})->with([
    ['GET', '/api/v1/users/me'],
    ['PATCH', '/api/v1/users/me'],
    ['PATCH', '/api/v1/users/me/location'],
    ['PATCH', '/api/v1/users/me/password'],
]);

test('invalid current password fails', function () {
    $user = profileUser();
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/users/me/password', [
        'current_password' => 'wrong-password',
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ]);

    $response
        ->assertUnprocessable()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Os dados fornecidos são inválidos.')
        ->assertJsonStructure(['errors' => ['current_password']]);
});

/**
 * @param  array<string, mixed>  $overrides
 */
function profileUser(array $overrides = []): User
{
    return User::factory()->create([
        'email' => 'profile@example.com',
        'phone' => '+258840000100',
        'password' => Hash::make('password123'),
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
        ...$overrides,
    ]);
}
