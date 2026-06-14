<?php

use App\Enums\UserType;
use App\Models\ProfessionalPortfolioItem;
use App\Models\ProfessionalProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('professional can list portfolio', function () {
    Storage::fake('public');
    $user = portfolioProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    portfolioItemForProfile($profile, ['title' => 'Projecto de rede']);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/professional/portfolio');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Portefólio carregado com sucesso.')
        ->assertJsonCount(1, 'data.portfolio_items')
        ->assertJsonPath('data.portfolio_items.0.title', 'Projecto de rede');
});

test('professional can upload portfolio item', function () {
    Storage::fake('public');
    $user = portfolioProfessionalUser();
    ProfessionalProfile::factory()->for($user)->create();
    Sanctum::actingAs($user);

    $file = UploadedFile::fake()->create('portfolio.pdf', 512, 'application/pdf');

    $response = $this->postJson('/api/v1/professional/portfolio', [
        'title' => 'Instalação eléctrica',
        'description' => 'Relatório e fotografias de um trabalho concluído.',
        'file' => $file,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Item de portefólio carregado com sucesso.')
        ->assertJsonPath('data.portfolio_item.title', 'Instalação eléctrica')
        ->assertJsonPath('data.portfolio_item.file_name', 'portfolio.pdf');

    $filePath = $response->json('data.portfolio_item.file_path');

    Storage::disk('public')->assertExists($filePath);

    $this->assertDatabaseHas('professional_portfolio_items', [
        'title' => 'Instalação eléctrica',
        'file_name' => 'portfolio.pdf',
        'file_path' => $filePath,
    ]);
});

test('professional without profile cannot upload portfolio item', function () {
    Storage::fake('public');
    $user = portfolioProfessionalUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/professional/portfolio', [
        'title' => 'Trabalho sem perfil',
        'file' => UploadedFile::fake()->create('portfolio.pdf', 128, 'application/pdf'),
    ]);

    $response
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Crie um perfil profissional antes de gerir o portefólio.');
});

test('client cannot access portfolio routes', function (string $method, string $uri, array $payload) {
    Storage::fake('public');
    $client = portfolioClientUser();
    Sanctum::actingAs($client);

    $response = $this->json($method, $uri, $payload);

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a profissionais.');
})->with([
    ['GET', '/api/v1/professional/portfolio', []],
    ['POST', '/api/v1/professional/portfolio', []],
]);

test('client cannot delete portfolio item', function () {
    Storage::fake('public');
    $owner = portfolioProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($owner)->create();
    $portfolioItem = portfolioItemForProfile($profile);
    $client = portfolioClientUser();
    Sanctum::actingAs($client);

    $response = $this->deleteJson("/api/v1/professional/portfolio/{$portfolioItem->id}");

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a profissionais.');
});

test('professional can delete own portfolio item', function () {
    Storage::fake('public');
    $user = portfolioProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($user)->create();
    $portfolioItem = portfolioItemForProfile($profile);
    Sanctum::actingAs($user);

    $response = $this->deleteJson("/api/v1/professional/portfolio/{$portfolioItem->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Item de portefólio eliminado com sucesso.');

    $this->assertSoftDeleted('professional_portfolio_items', [
        'id' => $portfolioItem->id,
    ]);
    Storage::disk('public')->assertMissing($portfolioItem->file_path);
});

test('professional cannot delete another professional portfolio item', function () {
    Storage::fake('public');
    $owner = portfolioProfessionalUser();
    $ownerProfile = ProfessionalProfile::factory()->for($owner)->create();
    $portfolioItem = portfolioItemForProfile($ownerProfile);

    $otherProfessional = portfolioProfessionalUser();
    ProfessionalProfile::factory()->for($otherProfessional)->create();
    Sanctum::actingAs($otherProfessional);

    $response = $this->deleteJson("/api/v1/professional/portfolio/{$portfolioItem->id}");

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode eliminar este item de portefólio.');

    $this->assertDatabaseHas('professional_portfolio_items', [
        'id' => $portfolioItem->id,
        'deleted_at' => null,
    ]);
    Storage::disk('public')->assertExists($portfolioItem->file_path);
});

function portfolioProfessionalUser(): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
    ]);
    $user->assignRole('professional');

    return $user;
}

function portfolioClientUser(): User
{
    Role::findOrCreate('client');

    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
    ]);
    $user->assignRole('client');

    return $user;
}

/**
 * @param  array<string, mixed>  $overrides
 */
function portfolioItemForProfile(ProfessionalProfile $profile, array $overrides = []): ProfessionalPortfolioItem
{
    $filePath = $overrides['file_path'] ?? "professional-portfolios/{$profile->id}/sample.pdf";
    Storage::disk('public')->put($filePath, 'portfolio content');

    return ProfessionalPortfolioItem::create([
        'professional_profile_id' => $profile->id,
        'title' => 'Amostra de portefólio',
        'description' => 'Descrição do item de portefólio.',
        'file_path' => $filePath,
        'file_name' => 'sample.pdf',
        'file_type' => 'application/pdf',
        'file_size' => 128,
        ...$overrides,
    ]);
}
