<?php

use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\ProfessionalDocument;
use App\Models\ProfessionalProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('admin can list verifications', function () {
    Storage::fake('local');
    $admin = adminVerificationUser('admin');
    adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::Pending,
    ]);
    adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::Approved,
    ]);
    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/admin/verifications');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Verificações carregadas com sucesso.')
        ->assertJsonCount(2, 'data.verifications')
        ->assertJsonPath('data.pagination.per_page', 15);
});

test('admin can filter by status', function () {
    Storage::fake('local');
    $admin = adminVerificationUser('super_admin');
    $pending = adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::Pending,
    ]);
    adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::Rejected,
    ]);
    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/admin/verifications?status=pending');

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.verifications')
        ->assertJsonPath('data.verifications.0.id', $pending->id)
        ->assertJsonPath('data.verifications.0.verification_status', 'pending');
});

test('admin can view verification details', function () {
    Storage::fake('local');
    $admin = adminVerificationUser('admin');
    $profile = adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::UnderReview,
    ]);
    adminDocumentForProfile($profile, [
        'document_type' => 'bi',
        'status' => 'pending',
    ]);
    adminDocumentForProfile($profile, [
        'document_type' => 'nuit',
        'status' => 'approved',
    ]);
    Sanctum::actingAs($admin);

    $response = $this->getJson("/api/v1/admin/verifications/{$profile->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Verificação carregada com sucesso.')
        ->assertJsonPath('data.verification.id', $profile->id)
        ->assertJsonPath('data.verification.verification_status', 'under_review')
        ->assertJsonCount(2, 'data.verification.documents')
        ->assertJsonPath('data.verification.user.name', $profile->user->name);
});

test('admin can approve professional verification', function () {
    Storage::fake('local');
    $admin = adminVerificationUser('super_admin');
    $profile = adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::Pending,
    ]);
    $pendingDocument = adminDocumentForProfile($profile, [
        'document_type' => 'bi',
        'status' => 'pending',
    ]);
    adminDocumentForProfile($profile, [
        'document_type' => 'certificate',
        'status' => 'approved',
    ]);
    Sanctum::actingAs($admin);

    $response = $this->postJson("/api/v1/admin/verifications/{$profile->id}/approve");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Verificação aprovada com sucesso.')
        ->assertJsonPath('data.verification.verification_status', 'approved');

    $this->assertDatabaseHas('professional_profiles', [
        'id' => $profile->id,
        'verification_status' => 'approved',
    ]);

    $this->assertDatabaseHas('professional_documents', [
        'id' => $pendingDocument->id,
        'status' => 'approved',
        'reviewed_by' => $admin->id,
        'rejection_reason' => null,
    ]);
});

test('admin can reject professional verification with reason', function () {
    Storage::fake('local');
    $admin = adminVerificationUser('admin');
    $profile = adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::UnderReview,
    ]);
    $pendingDocument = adminDocumentForProfile($profile, [
        'document_type' => 'bi',
        'status' => 'pending',
    ]);
    Sanctum::actingAs($admin);

    $response = $this->postJson("/api/v1/admin/verifications/{$profile->id}/reject", [
        'reason' => 'Os documentos enviados estão incompletos.',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Verificação rejeitada com sucesso.')
        ->assertJsonPath('data.verification.verification_status', 'rejected');

    $this->assertDatabaseHas('professional_profiles', [
        'id' => $profile->id,
        'verification_status' => 'rejected',
    ]);

    $this->assertDatabaseHas('professional_documents', [
        'id' => $pendingDocument->id,
        'status' => 'rejected',
        'reviewed_by' => $admin->id,
        'rejection_reason' => 'Os documentos enviados estão incompletos.',
    ]);
});

test('approval updates pending documents', function () {
    Storage::fake('local');
    $admin = adminVerificationUser('admin');
    $profile = adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::Pending,
    ]);
    $approvedDocument = adminDocumentForProfile($profile, [
        'document_type' => 'certificate',
        'status' => 'approved',
    ]);
    $pendingDocument = adminDocumentForProfile($profile, [
        'document_type' => 'bi',
        'status' => 'pending',
    ]);
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/verifications/{$profile->id}/approve")->assertSuccessful();

    expect($approvedDocument->refresh()->status)->toBe('approved')
        ->and($pendingDocument->refresh()->status)->toBe('approved')
        ->and($pendingDocument->reviewed_by)->toBe($admin->id)
        ->and($pendingDocument->rejection_reason)->toBeNull();
});

test('rejection updates pending documents with rejection reason', function () {
    Storage::fake('local');
    $admin = adminVerificationUser('super_admin');
    $profile = adminVerificationProfile(profileOverrides: [
        'verification_status' => VerificationStatus::UnderReview,
    ]);
    $pendingDocument = adminDocumentForProfile($profile, [
        'document_type' => 'bi',
        'status' => 'pending',
    ]);
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/verifications/{$profile->id}/reject", [
        'reason' => 'Faltam documentos obrigatórios para validação.',
    ])->assertSuccessful();

    expect($pendingDocument->refresh()->status)->toBe('rejected')
        ->and($pendingDocument->rejection_reason)->toBe('Faltam documentos obrigatórios para validação.')
        ->and($pendingDocument->reviewed_by)->toBe($admin->id);
});

test('client and professional cannot access admin verification routes', function (string $role, array $routeData) {
    Storage::fake('local');
    $profile = adminVerificationProfile();
    $user = $role === 'client' ? adminClientUser() : adminProfessionalUser();
    Sanctum::actingAs($user);

    $uri = str_replace('{profile}', (string) $profile->id, $routeData['uri']);

    $response = $this->json($routeData['method'], $uri, $routeData['payload']);

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a administradores.');
})->with([
    'client list' => ['client', ['method' => 'GET', 'uri' => '/api/v1/admin/verifications', 'payload' => []]],
    'client detail' => ['client', ['method' => 'GET', 'uri' => '/api/v1/admin/verifications/{profile}', 'payload' => []]],
    'client approve' => ['client', ['method' => 'POST', 'uri' => '/api/v1/admin/verifications/{profile}/approve', 'payload' => []]],
    'client reject' => ['client', ['method' => 'POST', 'uri' => '/api/v1/admin/verifications/{profile}/reject', 'payload' => []]],
    'professional list' => ['professional', ['method' => 'GET', 'uri' => '/api/v1/admin/verifications', 'payload' => []]],
    'professional detail' => ['professional', ['method' => 'GET', 'uri' => '/api/v1/admin/verifications/{profile}', 'payload' => []]],
    'professional approve' => ['professional', ['method' => 'POST', 'uri' => '/api/v1/admin/verifications/{profile}/approve', 'payload' => []]],
    'professional reject' => ['professional', ['method' => 'POST', 'uri' => '/api/v1/admin/verifications/{profile}/reject', 'payload' => []]],
]);

function adminVerificationUser(string $role): User
{
    Role::findOrCreate($role);

    $user = User::factory()->admin()->create([
        'user_type' => UserType::Admin,
    ]);
    $user->assignRole($role);

    return $user;
}

function adminClientUser(): User
{
    Role::findOrCreate('client');

    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
    ]);
    $user->assignRole('client');

    return $user;
}

function adminProfessionalUser(): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
    ]);
    $user->assignRole('professional');

    return $user;
}

/**
 * @param  array<string, mixed>  $userOverrides
 * @param  array<string, mixed>  $profileOverrides
 */
function adminVerificationProfile(array $userOverrides = [], array $profileOverrides = []): ProfessionalProfile
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => $userOverrides['status'] ?? UserStatus::Active,
        ...$userOverrides,
    ]);
    $user->assignRole('professional');

    return ProfessionalProfile::factory()->for($user)->create([
        'verification_status' => VerificationStatus::Pending,
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        ...$profileOverrides,
    ]);
}

/**
 * @param  array<string, mixed>  $overrides
 */
function adminDocumentForProfile(ProfessionalProfile $profile, array $overrides = []): ProfessionalDocument
{
    $filePath = $overrides['file_path'] ?? "verification-documents/{$profile->id}/sample.pdf";
    Storage::disk('local')->put($filePath, 'document content');

    return ProfessionalDocument::create([
        'professional_profile_id' => $profile->id,
        'document_type' => 'bi',
        'file_path' => $filePath,
        'file_name' => 'sample.pdf',
        'file_type' => 'application/pdf',
        'file_size' => 128,
        'status' => 'pending',
        ...$overrides,
    ]);
}
