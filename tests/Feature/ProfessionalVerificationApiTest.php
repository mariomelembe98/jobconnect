<?php

use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\ProfessionalDocument;
use App\Models\ProfessionalProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('professional can view verification status', function () {
    Storage::fake('local');
    $user = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create([
        'verification_status' => VerificationStatus::Pending,
    ]);
    professionalDocumentForProfile($profile, ['document_type' => 'bi']);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/professional/verification');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Estado de verificação carregado com sucesso.')
        ->assertJsonPath('data.verification.verification_status', 'pending')
        ->assertJsonPath('data.verification.documents_submitted', 1)
        ->assertJsonPath('data.verification.documents_required', 2)
        ->assertJsonPath('data.verification.required_documents.0', 'bi')
        ->assertJsonPath('data.verification.required_documents.1', 'nuit')
        ->assertJsonPath('data.verification.missing_required_documents.0', 'nuit');
});

test('professional can upload document', function () {
    Storage::fake('local');
    $user = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create([
        'verification_status' => VerificationStatus::Rejected,
    ]);
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/professional/documents', [
        'document_type' => 'bi',
        'file' => UploadedFile::fake()->create('bi.pdf', 512, 'application/pdf'),
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Documento carregado com sucesso.')
        ->assertJsonPath('data.document.document_type', 'bi')
        ->assertJsonPath('data.document.status', 'pending')
        ->assertJsonPath('data.document.file_name', 'bi.pdf');

    $document = ProfessionalDocument::query()
        ->where('professional_profile_id', $profile->id)
        ->firstOrFail();

    $this->assertDatabaseHas('professional_documents', [
        'professional_profile_id' => $profile->id,
        'document_type' => 'bi',
        'status' => 'pending',
        'file_name' => 'bi.pdf',
        'file_path' => $document->file_path,
    ]);

    expect($profile->refresh()->verification_status)->toBe(VerificationStatus::Pending);
});

test('uploaded verification document is stored on private disk and path', function () {
    Storage::fake('local');
    Storage::fake('public');
    $user = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/professional/documents', [
        'document_type' => 'bi',
        'file' => UploadedFile::fake()->create('bi.pdf', 256, 'application/pdf'),
    ])->assertCreated();

    $document = ProfessionalDocument::query()
        ->where('professional_profile_id', $profile->id)
        ->firstOrFail();

    expect($document->file_path)->toStartWith("verification-documents/{$profile->id}/");
    Storage::disk('local')->assertExists($document->file_path);
    Storage::disk('public')->assertMissing($document->file_path);
});

test('document resource does not expose public path or url', function () {
    Storage::fake('local');
    $user = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    $document = professionalDocumentForProfile($profile, ['document_type' => 'bi']);
    Sanctum::actingAs($user);

    $response = $this->getJson("/api/v1/professional/documents/{$document->id}");

    $response->assertSuccessful();

    $payload = $response->json('data.document');

    expect($payload)->toMatchArray([
        'id' => $document->id,
        'document_type' => 'bi',
        'file_name' => 'sample.pdf',
        'file_type' => 'application/pdf',
        'file_size' => 128,
        'status' => 'pending',
        'reviewed_at' => null,
        'rejection_reason' => null,
    ])
        ->and($payload)->not->toHaveKey('professional_profile_id')
        ->and($payload)->not->toHaveKey('file_path')
        ->and($payload)->not->toHaveKey('file_url')
        ->and($payload)->not->toHaveKey('reviewed_by')
        ->and($payload)->not->toHaveKey('created_at')
        ->and($payload)->not->toHaveKey('updated_at');
});

test('owner can download own document', function () {
    Storage::fake('local');
    $user = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    $document = professionalDocumentForProfile($profile, ['document_type' => 'bi']);
    Sanctum::actingAs($user);

    $this->get("/api/v1/professional/documents/{$document->id}/download")
        ->assertOk()
        ->assertDownload('sample.pdf');
});

test('admin can download professional document', function () {
    Storage::fake('local');
    $owner = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($owner)->create();
    $document = professionalDocumentForProfile($profile, ['document_type' => 'bi']);

    Sanctum::actingAs(verificationAdminUser('admin'));

    $this->get("/api/v1/professional/documents/{$document->id}/download")
        ->assertOk()
        ->assertDownload('sample.pdf');
});

test('unrelated professional cannot download document', function () {
    Storage::fake('local');
    $owner = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($owner)->create();
    $document = professionalDocumentForProfile($profile, ['document_type' => 'bi']);

    $other = verificationProfessionalUser();
    ProfessionalProfile::factory()->for($other)->create();
    Sanctum::actingAs($other);

    $this->get("/api/v1/professional/documents/{$document->id}/download")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode descarregar este documento.');
});

test('client cannot download document', function () {
    Storage::fake('local');
    $owner = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($owner)->create();
    $document = professionalDocumentForProfile($profile, ['document_type' => 'bi']);

    Sanctum::actingAs(verificationClientUser());

    $this->get("/api/v1/professional/documents/{$document->id}/download")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode descarregar este documento.');
});

test('professional can list own documents', function () {
    Storage::fake('local');
    $user = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    professionalDocumentForProfile($profile, ['document_type' => 'bi']);
    professionalDocumentForProfile($profile, ['document_type' => 'nuit']);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/professional/documents');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Documentos carregados com sucesso.')
        ->assertJsonCount(2, 'data.documents');
});

test('professional can view own document', function () {
    Storage::fake('local');
    $user = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    $document = professionalDocumentForProfile($profile, ['document_type' => 'certificate']);
    Sanctum::actingAs($user);

    $response = $this->getJson("/api/v1/professional/documents/{$document->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Documento carregado com sucesso.')
        ->assertJsonPath('data.document.id', $document->id)
        ->assertJsonPath('data.document.document_type', 'certificate');
});

test('professional cannot view another professional document', function () {
    Storage::fake('local');
    $owner = verificationProfessionalUser();
    $ownerProfile = ProfessionalProfile::factory()->for($owner)->create();
    $document = professionalDocumentForProfile($ownerProfile);

    $otherProfessional = verificationProfessionalUser();
    ProfessionalProfile::factory()->for($otherProfessional)->create();
    Sanctum::actingAs($otherProfessional);

    $response = $this->getJson("/api/v1/professional/documents/{$document->id}");

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode visualizar este documento.');
});

test('professional without profile cannot upload', function () {
    Storage::fake('local');
    $user = verificationProfessionalUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/professional/documents', [
        'document_type' => 'bi',
        'file' => UploadedFile::fake()->create('bi.pdf', 128, 'application/pdf'),
    ]);

    $response
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Crie um perfil profissional antes de gerir documentos.');
});

test('client cannot access verification routes', function (string $method, string $uri, array $payload) {
    Storage::fake('local');
    $owner = verificationProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($owner)->create();
    $document = professionalDocumentForProfile($profile);

    $client = verificationClientUser();
    Sanctum::actingAs($client);

    $uri = str_replace('{document}', (string) $document->id, $uri);

    $response = $this->json($method, $uri, $payload);

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a profissionais.');
})->with([
    ['GET', '/api/v1/professional/verification', []],
    ['GET', '/api/v1/professional/documents', []],
    ['POST', '/api/v1/professional/documents', []],
    ['GET', '/api/v1/professional/documents/{document}', []],
]);

function verificationProfessionalUser(): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
    ]);
    $user->assignRole('professional');

    return $user;
}

function verificationClientUser(): User
{
    Role::findOrCreate('client');

    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
    ]);
    $user->assignRole('client');

    return $user;
}

function verificationAdminUser(string $role = 'admin'): User
{
    Role::findOrCreate($role);

    $user = User::factory()->admin()->create([
        'user_type' => UserType::Admin,
    ]);
    $user->assignRole($role);

    return $user;
}

/**
 * @param  array<string, mixed>  $overrides
 */
function professionalDocumentForProfile(ProfessionalProfile $profile, array $overrides = []): ProfessionalDocument
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
        'status' => VerificationStatus::Pending->value,
        ...$overrides,
    ]);
}
