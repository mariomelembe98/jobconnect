<?php

use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\ProfessionalProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('suspended professional with existing token cannot access professional profile', function () {
    $user = professionalMiddlewareUser(UserStatus::Suspended);
    $token = $user->createToken('middleware-test')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/professional/profile');

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A sua conta está suspensa.');

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('blocked professional with existing token cannot access professional profile', function () {
    $user = professionalMiddlewareUser(UserStatus::Blocked);
    $token = $user->createToken('middleware-test')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/professional/profile');

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A sua conta está bloqueada.');

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('suspended admin with existing token cannot access admin dashboard', function () {
    $user = adminMiddlewareUser(UserStatus::Suspended);
    $token = $user->createToken('middleware-test')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/admin/dashboard');

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A sua conta está suspensa.');

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('blocked admin with existing token cannot access admin dashboard', function () {
    $user = adminMiddlewareUser(UserStatus::Blocked);
    $token = $user->createToken('middleware-test')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/admin/dashboard');

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A sua conta está bloqueada.');

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('active professional can still access professional route', function () {
    $user = professionalMiddlewareUser(UserStatus::Active);
    $token = $user->createToken('middleware-test')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/professional/profile');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Perfil profissional carregado com sucesso.')
        ->assertJsonPath('data.profile.user_id', $user->id);
});

test('active admin can still access admin route', function () {
    $user = adminMiddlewareUser(UserStatus::Active);
    $token = $user->createToken('middleware-test')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/admin/dashboard');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Painel administrativo carregado com sucesso.')
        ->assertJsonStructure(['data' => [
            'users_total',
            'clients_total',
            'professionals_total',
            'verified_professionals',
            'service_requests_total',
            'active_contracts',
            'completed_contracts',
            'open_disputes',
            'pending_reports',
        ]]);
});

function professionalMiddlewareUser(UserStatus $status): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => $status,
    ]);
    $user->assignRole('professional');
    ProfessionalProfile::factory()->for($user)->create();

    return $user->refresh();
}

function adminMiddlewareUser(UserStatus $status): User
{
    Role::findOrCreate('admin');

    $user = User::factory()->admin()->create([
        'user_type' => UserType::Admin,
        'status' => $status,
    ]);
    $user->assignRole('admin');

    return $user->refresh();
}
