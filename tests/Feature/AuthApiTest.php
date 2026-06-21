<?php

use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('user can register as client', function () {
    $response = $this->postJson('/api/v1/auth/register', registerPayload([
        'user_type' => UserType::Client->value,
    ]));

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Conta criada com sucesso.')
        ->assertJsonPath('data.user.user_type', UserType::Client->value)
        ->assertJsonStructure(['data' => ['token', 'user']]);

    $user = User::where('phone', '+258840000001')->firstOrFail();

    expect($user->hasRole('client'))->toBeTrue();
});

test('user can register as professional', function () {
    $response = $this->postJson('/api/v1/auth/register', registerPayload([
        'phone' => '+258840000002',
        'email' => 'professional@example.com',
        'user_type' => UserType::Professional->value,
    ]));

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.user_type', UserType::Professional->value)
        ->assertJsonStructure(['data' => ['token', 'user']]);

    $user = User::where('phone', '+258840000002')->firstOrFail();

    expect($user->hasRole('professional'))->toBeTrue();
});

test('user can login with email', function () {
    $user = userForLogin();

    $response = $this->postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'password123',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Sessão iniciada com sucesso.')
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonStructure(['data' => ['token', 'user']]);
});

test('user can login with phone', function () {
    $user = userForLogin([
        'email' => 'phone-login@example.com',
        'phone' => '+258840000004',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'identifier' => $user->phone,
        'password' => 'password123',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonStructure(['data' => ['token', 'user']]);
});

test('user can fetch me', function () {
    $user = userForLogin();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/auth/me');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Utilizador autenticado.')
        ->assertJsonPath('data.user.id', $user->id);
});

test('user can logout', function () {
    $user = userForLogin();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->postJson('/api/v1/auth/logout');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Sessão terminada com sucesso.');

    expect($user->tokens()->count())->toBe(0);
});

test('invalid credentials return 401', function () {
    $user = userForLogin();

    $response = $this->postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response
        ->assertUnauthorized()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Credenciais inválidas.');
});

test('suspended user cannot login', function () {
    $user = userForLogin([
        'status' => UserStatus::Suspended,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'password123',
    ]);

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A sua conta está suspensa. Contacte o suporte.');

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('blocked user cannot login', function () {
    $user = userForLogin([
        'status' => UserStatus::Blocked,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'password123',
    ]);

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A sua conta está bloqueada. Contacte o suporte.');

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('suspended user with existing token cannot access protected api', function () {
    $user = userForLogin();
    $token = $user->createToken('test-token')->plainTextToken;
    $user->update(['status' => UserStatus::Suspended]);

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/auth/me');

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A sua conta está suspensa.');

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('blocked user with existing token cannot access protected api', function () {
    $user = userForLogin();
    $token = $user->createToken('test-token')->plainTextToken;
    $user->update(['status' => UserStatus::Blocked]);

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/auth/me');

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A sua conta está bloqueada.');

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('active user can login and access protected api', function () {
    $user = userForLogin();

    $loginResponse = $this->postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'password123',
    ]);

    $loginResponse
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.id', $user->id);

    $token = $loginResponse->json('data.token');

    $this
        ->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertSuccessful()
        ->assertJsonPath('data.user.id', $user->id);
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function registerPayload(array $overrides = []): array
{
    return [
        'name' => 'Cliente Tempo',
        'email' => 'client@example.com',
        'phone' => '+258840000001',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'user_type' => UserType::Client->value,
        ...$overrides,
    ];
}

/**
 * @param  array<string, mixed>  $overrides
 */
function userForLogin(array $overrides = []): User
{
    return User::factory()->create([
        'email' => 'login@example.com',
        'phone' => '+258840000003',
        'password' => Hash::make('password123'),
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
        ...$overrides,
    ]);
}
