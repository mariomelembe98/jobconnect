<?php

use App\Enums\ProposalStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserType;
use App\Models\Category;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('client can create service request', function () {
    $client = serviceRequestClientUser();
    Sanctum::actingAs($client);
    $category = Category::factory()->create();

    $response = $this->postJson('/api/v1/service-requests', serviceRequestPayload($category));

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Pedido de serviço criado com sucesso.')
        ->assertJsonPath('data.service_request.title', 'Preciso de ajuda com electricidade')
        ->assertJsonPath('data.service_request.status', 'published');

    $this->assertDatabaseHas('service_requests', [
        'client_id' => $client->id,
        'category_id' => $category->id,
        'title' => 'Preciso de ajuda com electricidade',
        'status' => 'published',
    ]);
});

test('professional cannot create service request', function () {
    $professional = serviceRequestProfessionalUser();
    Sanctum::actingAs($professional);
    $category = Category::factory()->create();

    $response = $this->postJson('/api/v1/service-requests', serviceRequestPayload($category));

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a clientes.');
});

test('client can list own service requests', function () {
    $client = serviceRequestClientUser();
    $otherClient = serviceRequestClientUser();
    $ownOne = createServiceRequest($client, ['title' => 'Pedido um']);
    $professional = serviceRequestProfessionalUser();
    $profile = ProfessionalProfile::factory()->for($professional)->create();
    Proposal::create([
        'service_request_id' => $ownOne->id,
        'professional_profile_id' => $profile->id,
        'amount' => '850.00',
        'delivery_days' => 5,
        'message' => 'Posso ajudar com este serviço.',
        'status' => ProposalStatus::Pending,
    ]);
    createServiceRequest($otherClient, ['title' => 'Pedido de outra pessoa']);
    Sanctum::actingAs($client);

    $response = $this->getJson('/api/v1/client/service-requests');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Pedidos de serviço carregados com sucesso.')
        ->assertJsonCount(1, 'data.service_requests')
        ->assertJsonPath('data.service_requests.0.id', $ownOne->id)
        ->assertJsonPath('data.service_requests.0.title', 'Pedido um')
        ->assertJsonPath('data.service_requests.0.proposals_count', 1);
});

test('client can filter own service requests by status', function () {
    $client = serviceRequestClientUser();
    createServiceRequest($client, [
        'title' => 'Pedido publicado',
        'status' => ServiceRequestStatus::Published,
    ]);
    $completed = createServiceRequest($client, [
        'title' => 'Pedido concluído',
        'status' => ServiceRequestStatus::Completed,
    ]);
    Sanctum::actingAs($client);

    $response = $this->getJson('/api/v1/client/service-requests?status=completed');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.service_requests')
        ->assertJsonPath('data.service_requests.0.id', $completed->id)
        ->assertJsonPath('data.service_requests.0.status', 'completed');
});

test('client published filter includes requests receiving proposals', function () {
    $client = serviceRequestClientUser();
    $published = createServiceRequest($client, [
        'title' => 'Pedido publicado',
        'status' => ServiceRequestStatus::Published,
    ]);
    $receivingProposals = createServiceRequest($client, [
        'title' => 'Pedido a receber propostas',
        'status' => ServiceRequestStatus::ReceivingProposals,
    ]);
    Sanctum::actingAs($client);

    $response = $this->getJson('/api/v1/client/service-requests?status=published');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data.service_requests');

    $ids = collect($response->json('data.service_requests'))->pluck('id')->all();

    expect($ids)->toContain($published->id, $receivingProposals->id);
});

test('professional can list public service requests', function () {
    $professional = serviceRequestProfessionalUser();
    $published = createServiceRequest(serviceRequestClientUser(), [
        'title' => 'Pedido publicado',
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    createServiceRequest(serviceRequestClientUser(), [
        'title' => 'Pedido rascunho',
        'status' => ServiceRequestStatus::Draft,
        'visibility' => 'public',
    ]);
    Sanctum::actingAs($professional);

    $response = $this->getJson('/api/v1/service-requests');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Pedidos de serviço carregados com sucesso.')
        ->assertJsonCount(1, 'data.service_requests')
        ->assertJsonPath('data.service_requests.0.id', $published->id)
        ->assertJsonPath('data.service_requests.0.status', 'published');
});

test('guest can view published service request', function () {
    $serviceRequest = createServiceRequest(serviceRequestClientUser(), [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
        'title' => 'Pedido público',
    ]);

    $response = $this->getJson("/api/v1/service-requests/{$serviceRequest->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Pedido de serviço carregado com sucesso.')
        ->assertJsonPath('data.service_request.title', 'Pedido público');
});

test('guest cannot view private service request', function () {
    $serviceRequest = createServiceRequest(serviceRequestClientUser(), [
        'status' => ServiceRequestStatus::Draft,
        'visibility' => 'private',
    ]);

    $response = $this->getJson("/api/v1/service-requests/{$serviceRequest->id}");

    $response
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Pedido de serviço não encontrado.');
});

test('can filter service requests by category city and status', function () {
    $professional = serviceRequestProfessionalUser();
    $matchingCategory = Category::factory()->create();
    $otherCategory = Category::factory()->create();
    $matching = createServiceRequest(serviceRequestClientUser(), [
        'category_id' => $matchingCategory->id,
        'city' => 'Maputo',
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    createServiceRequest(serviceRequestClientUser(), [
        'category_id' => $otherCategory->id,
        'city' => 'Beira',
        'status' => ServiceRequestStatus::ReceivingProposals,
        'visibility' => 'public',
    ]);
    Sanctum::actingAs($professional);

    $response = $this->getJson("/api/v1/service-requests?category_id={$matchingCategory->id}&city=Maputo&status=published");

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.service_requests')
        ->assertJsonPath('data.service_requests.0.id', $matching->id)
        ->assertJsonPath('data.service_requests.0.city', 'Maputo');
});

test('owner can update service request', function () {
    $client = serviceRequestClientUser();
    $serviceRequest = createServiceRequest($client, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    Sanctum::actingAs($client);

    $response = $this->patchJson("/api/v1/service-requests/{$serviceRequest->id}", [
        'title' => 'Título actualizado',
        'description' => 'Descrição actualizada com detalhe suficiente para validação.',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Pedido de serviço actualizado com sucesso.')
        ->assertJsonPath('data.service_request.title', 'Título actualizado');

    $this->assertDatabaseHas('service_requests', [
        'id' => $serviceRequest->id,
        'title' => 'Título actualizado',
    ]);
});

test('non-owner cannot update service request', function () {
    $owner = serviceRequestClientUser();
    $serviceRequest = createServiceRequest($owner);
    $otherClient = serviceRequestClientUser();
    Sanctum::actingAs($otherClient);

    $response = $this->patchJson("/api/v1/service-requests/{$serviceRequest->id}", [
        'title' => 'Título indevido',
    ]);

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado ao proprietário.');
});

test('owner can cancel service request', function () {
    $client = serviceRequestClientUser();
    $serviceRequest = createServiceRequest($client, [
        'status' => ServiceRequestStatus::Published,
    ]);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/service-requests/{$serviceRequest->id}/cancel");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Pedido de serviço cancelado com sucesso.')
        ->assertJsonPath('data.service_request.status', 'cancelled');

    $this->assertDatabaseHas('service_requests', [
        'id' => $serviceRequest->id,
        'status' => 'cancelled',
    ]);
});

test('owner can upload attachment', function () {
    Storage::fake('public');
    $client = serviceRequestClientUser();
    $serviceRequest = createServiceRequest($client, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/service-requests/{$serviceRequest->id}/attachments", [
        'files' => [
            UploadedFile::fake()->create('proposal.pdf', 512, 'application/pdf'),
        ],
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Anexos carregados com sucesso.')
        ->assertJsonCount(1, 'data.attachments');

    $filePath = $response->json('data.attachments.0.file_path');

    Storage::disk('public')->assertExists($filePath);

    $this->assertDatabaseHas('service_request_attachments', [
        'service_request_id' => $serviceRequest->id,
        'file_name' => 'proposal.pdf',
        'file_path' => $filePath,
    ]);
});

test('owner can delete attachment', function () {
    Storage::fake('public');
    $client = serviceRequestClientUser();
    $serviceRequest = createServiceRequest($client);
    $attachment = createAttachment($serviceRequest);
    Sanctum::actingAs($client);

    $response = $this->deleteJson("/api/v1/service-requests/{$serviceRequest->id}/attachments/{$attachment->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Anexo eliminado com sucesso.');

    $this->assertDatabaseMissing('service_request_attachments', [
        'id' => $attachment->id,
    ]);

    Storage::disk('public')->assertMissing($attachment->file_path);
});

test('non-owner cannot delete attachment', function () {
    Storage::fake('public');
    $owner = serviceRequestClientUser();
    $serviceRequest = createServiceRequest($owner);
    $attachment = createAttachment($serviceRequest);
    $otherClient = serviceRequestClientUser();
    Sanctum::actingAs($otherClient);

    $response = $this->deleteJson("/api/v1/service-requests/{$serviceRequest->id}/attachments/{$attachment->id}");

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode eliminar este anexo.');
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function serviceRequestPayload(Category $category, array $overrides = []): array
{
    return [
        'category_id' => $category->id,
        'title' => 'Preciso de ajuda com electricidade',
        'description' => 'Procuro um profissional para verificar uma instalação eléctrica residencial.',
        'service_type' => 'local',
        'budget_min' => 500,
        'budget_max' => 1500,
        'budget_type' => 'negotiable',
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        'address' => 'Avenida 24 de Julho',
        'latitude' => -25.9667,
        'longitude' => 32.5833,
        'deadline_at' => now()->addDays(7)->toDateTimeString(),
        'visibility' => 'public',
        ...$overrides,
    ];
}

function serviceRequestClientUser(): User
{
    Role::findOrCreate('client');

    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
    ]);
    $user->assignRole('client');

    return $user;
}

function serviceRequestProfessionalUser(): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
    ]);
    $user->assignRole('professional');

    return $user;
}

/**
 * @param  array<string, mixed>  $overrides
 */
function createServiceRequest(User $client, array $overrides = []): ServiceRequest
{
    $categoryId = $overrides['category_id'] ?? Category::factory()->create()->id;

    return ServiceRequest::create([
        'client_id' => $client->id,
        'category_id' => $categoryId,
        'title' => 'Pedido '.fake()->unique()->numberBetween(1000, 9999),
        'description' => 'Descrição suficientemente longa para validar o pedido de serviço.',
        'service_type' => 'local',
        'budget_min' => 500,
        'budget_max' => 1500,
        'budget_type' => 'negotiable',
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        'address' => 'Avenida 24 de Julho',
        'latitude' => -25.9667,
        'longitude' => 32.5833,
        'deadline_at' => now()->addDays(7),
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
        ...$overrides,
    ]);
}

/**
 * @param  array<string, mixed>  $overrides
 */
function createAttachment(ServiceRequest $serviceRequest, array $overrides = []): ServiceRequestAttachment
{
    $filePath = $overrides['file_path'] ?? "service-requests/{$serviceRequest->id}/attachments/sample.pdf";
    Storage::disk('public')->put($filePath, 'attachment content');

    return ServiceRequestAttachment::create([
        'service_request_id' => $serviceRequest->id,
        'file_path' => $filePath,
        'file_name' => 'sample.pdf',
        'file_type' => 'application/pdf',
        'file_size' => 128,
        ...$overrides,
    ]);
}
