<?php

use App\Enums\ContractStatus;
use App\Enums\DisputeResolution;
use App\Enums\DisputeStatus;
use App\Enums\ProposalStatus;
use App\Enums\ReportReason;
use App\Enums\ReportStatus;
use App\Enums\ReportType;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\Category;
use App\Models\Contract;
use App\Models\Dispute;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\Report;
use App\Models\ServiceRequest;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('admin can view dashboard', function () {
    $professional = sprintSixProfessional();
    $professional->professionalProfile->update(['verification_status' => VerificationStatus::Approved]);
    Sanctum::actingAs(sprintSixAdmin());

    $this->getJson('/api/v1/admin/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonStructure(['data' => [
            'users_total', 'clients_total', 'professionals_total', 'verified_professionals',
            'service_requests_total', 'active_contracts', 'completed_contracts',
            'open_disputes', 'pending_reports',
        ]])
        ->assertJsonPath('data.verified_professionals', 1);
});

test('non admin cannot view dashboard', function () {
    Sanctum::actingAs(sprintSixClient());

    $this->getJson('/api/v1/admin/dashboard')
        ->assertForbidden()
        ->assertJsonPath('message', 'Acesso reservado a administradores.');
});

test('admin can list users', function () {
    sprintSixClient();
    Sanctum::actingAs(sprintSixAdmin());

    $this->getJson('/api/v1/admin/users')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data.users');
});

test('admin can filter users by status type and query', function () {
    User::factory()->client()->create([
        'name' => 'Alberto Mapossa',
        'email' => 'alberto@example.test',
        'user_type' => UserType::Client,
        'status' => UserStatus::Suspended,
    ]);
    User::factory()->professional()->create([
        'name' => 'Outra Pessoa',
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
    ]);
    Sanctum::actingAs(sprintSixAdmin());

    $this->getJson('/api/v1/admin/users?user_type=client&status=suspended&q=Alberto')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.users')
        ->assertJsonPath('data.users.0.email', 'alberto@example.test');
});

test('admin can suspend user', function () {
    $user = sprintSixClient();
    Sanctum::actingAs(sprintSixAdmin());

    $this->postJson("/api/v1/admin/users/{$user->id}/suspend", ['reason' => 'Análise de segurança'])
        ->assertSuccessful()
        ->assertJsonPath('data.user.status', UserStatus::Suspended->value);

    expect($user->fresh()->status)->toBe(UserStatus::Suspended);
});

test('admin can reactivate user', function () {
    $user = sprintSixClient(['status' => UserStatus::Suspended]);
    Sanctum::actingAs(sprintSixAdmin());

    $this->postJson("/api/v1/admin/users/{$user->id}/reactivate")
        ->assertSuccessful()
        ->assertJsonPath('data.user.status', UserStatus::Active->value);
});

test('admin can block user and tokens are deleted', function () {
    $user = sprintSixClient();
    $user->createToken('telemóvel');
    $user->createToken('web');
    Sanctum::actingAs(sprintSixAdmin());

    $this->postJson("/api/v1/admin/users/{$user->id}/block")
        ->assertSuccessful()
        ->assertJsonPath('data.user.status', UserStatus::Blocked->value);

    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('non admin cannot access admin users', function () {
    Sanctum::actingAs(sprintSixClient());

    $this->getJson('/api/v1/admin/users')->assertForbidden();
});

test('admin can create and update categories', function () {
    Sanctum::actingAs(sprintSixAdmin());

    $categoryId = $this->postJson('/api/v1/admin/categories', [
        'name' => 'Reparações Domésticas',
        'description' => 'Serviços para residências.',
    ])
        ->assertCreated()
        ->assertJsonPath('data.category.status', 'active')
        ->json('data.category.id');

    $this->patchJson("/api/v1/admin/categories/{$categoryId}", [
        'name' => 'Manutenção Doméstica',
        'status' => 'inactive',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.category.name', 'Manutenção Doméstica')
        ->assertJsonPath('data.category.status', 'inactive');
});

test('admin can create and update skills', function () {
    $category = Category::factory()->create();
    Sanctum::actingAs(sprintSixAdmin());

    $skillId = $this->postJson('/api/v1/admin/skills', [
        'category_id' => $category->id,
        'name' => 'Instalação Eléctrica',
    ])
        ->assertCreated()
        ->assertJsonPath('data.skill.status', 'active')
        ->json('data.skill.id');

    $this->patchJson("/api/v1/admin/skills/{$skillId}", [
        'name' => 'Manutenção Eléctrica',
        'status' => 'inactive',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.skill.name', 'Manutenção Eléctrica')
        ->assertJsonPath('data.skill.status', 'inactive');
});

test('cannot delete category with attached service requests or professionals', function () {
    $client = sprintSixClient();
    $category = Category::factory()->create();
    sprintSixServiceRequest($client, $category);
    Sanctum::actingAs(sprintSixAdmin());

    $this->deleteJson("/api/v1/admin/categories/{$category->id}")
        ->assertConflict()
        ->assertJsonPath('success', false);

    expect($category->fresh()->deleted_at)->toBeNull();
});

test('cannot delete skill attached to professional', function () {
    $skill = Skill::factory()->create();
    $professional = sprintSixProfessional();
    $professional->professionalProfile->skills()->attach($skill);
    Sanctum::actingAs(sprintSixAdmin());

    $this->deleteJson("/api/v1/admin/skills/{$skill->id}")
        ->assertConflict()
        ->assertJsonPath('success', false);

    expect($skill->fresh()->deleted_at)->toBeNull();
});

test('admin can list reports', function () {
    $report = sprintSixReport();
    Sanctum::actingAs(sprintSixAdmin());

    $this->getJson('/api/v1/admin/reports')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.reports')
        ->assertJsonPath('data.reports.0.id', $report->id);
});

test('admin can mark report under review', function () {
    $report = sprintSixReport();
    $admin = sprintSixAdmin();
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/reports/{$report->id}/review")
        ->assertSuccessful()
        ->assertJsonPath('data.report.status', ReportStatus::Reviewing->value);

    expect($report->fresh()->reviewed_by)->toBe($admin->id)
        ->and($report->fresh()->reviewed_at)->not->toBeNull();
});

test('admin can resolve report', function () {
    $report = sprintSixReport();
    Sanctum::actingAs(sprintSixAdmin());

    $this->postJson("/api/v1/admin/reports/{$report->id}/resolve", [
        'resolution_note' => 'A denúncia foi confirmada e tratada.',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.report.status', ReportStatus::Resolved->value)
        ->assertJsonPath('data.report.resolution_note', 'A denúncia foi confirmada e tratada.');
});

test('admin can dismiss report', function () {
    $report = sprintSixReport();
    Sanctum::actingAs(sprintSixAdmin());

    $this->postJson("/api/v1/admin/reports/{$report->id}/dismiss", [
        'resolution_note' => 'Não foram encontrados elementos suficientes.',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.report.status', ReportStatus::Dismissed->value);
});

test('admin can list disputes', function () {
    [$dispute] = sprintSixDispute();
    Sanctum::actingAs(sprintSixAdmin());

    $this->getJson('/api/v1/admin/disputes')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.disputes')
        ->assertJsonPath('data.disputes.0.id', $dispute->id);
});

test('admin can assign dispute', function () {
    [$dispute] = sprintSixDispute();
    $assignee = sprintSixAdmin();
    Sanctum::actingAs(sprintSixAdmin());

    $this->postJson("/api/v1/admin/disputes/{$dispute->id}/assign", ['assigned_to' => $assignee->id])
        ->assertSuccessful()
        ->assertJsonPath('data.dispute.assigned_to', $assignee->id);
});

test('admin can resolve dispute and contract becomes completed', function () {
    [$dispute, $contract] = sprintSixDispute();
    Sanctum::actingAs(sprintSixAdmin());

    $this->postJson("/api/v1/admin/disputes/{$dispute->id}/resolve", [
        'resolution' => DisputeResolution::MutualAgreement->value,
        'resolution_note' => 'As partes aceitaram a solução apresentada.',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.dispute.status', DisputeStatus::Resolved->value)
        ->assertJsonPath('data.dispute.resolution', DisputeResolution::MutualAgreement->value);

    expect($contract->fresh()->status)->toBe(ContractStatus::Completed)
        ->and($dispute->fresh()->resolved_at)->not->toBeNull();
});

function sprintSixAdmin(): User
{
    Role::findOrCreate('admin');
    $user = User::factory()->admin()->create(['user_type' => UserType::Admin, 'status' => UserStatus::Active]);
    $user->assignRole('admin');

    return $user;
}

/** @param array<string, mixed> $overrides */
function sprintSixClient(array $overrides = []): User
{
    Role::findOrCreate('client');
    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
        ...$overrides,
    ]);
    $user->assignRole('client');

    return $user;
}

function sprintSixProfessional(): User
{
    Role::findOrCreate('professional');
    $user = User::factory()->professional()->create(['user_type' => UserType::Professional, 'status' => UserStatus::Active]);
    $user->assignRole('professional');
    ProfessionalProfile::factory()->create(['user_id' => $user->id]);

    return $user->refresh();
}

function sprintSixServiceRequest(User $client, ?Category $category = null): ServiceRequest
{
    return ServiceRequest::create([
        'client_id' => $client->id,
        'category_id' => ($category ?? Category::factory()->create())->id,
        'title' => 'Pedido administrativo de teste',
        'description' => 'Descrição suficientemente longa para o pedido administrativo de teste.',
        'service_type' => 'local',
        'budget_type' => 'negotiable',
        'province' => 'Maputo',
        'city' => 'Maputo',
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
}

function sprintSixReport(): Report
{
    return Report::create([
        'reporter_id' => sprintSixClient()->id,
        'reported_user_id' => sprintSixClient()->id,
        'report_type' => ReportType::User,
        'reason' => ReportReason::Abuse,
        'description' => 'Comportamento inadequado reportado para análise.',
        'status' => ReportStatus::Pending,
    ]);
}

/** @return array{Dispute, Contract} */
function sprintSixDispute(): array
{
    $client = sprintSixClient();
    $professional = sprintSixProfessional();
    $serviceRequest = sprintSixServiceRequest($client);
    $proposal = Proposal::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 3000,
        'delivery_days' => 5,
        'message' => 'Proposta para teste administrativo.',
        'status' => ProposalStatus::Accepted,
    ]);
    $contract = Contract::create([
        'service_request_id' => $serviceRequest->id,
        'proposal_id' => $proposal->id,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 3000,
        'platform_fee' => 300,
        'professional_amount' => 2700,
        'status' => ContractStatus::Disputed,
        'started_at' => now()->subDay(),
    ]);
    $dispute = Dispute::create([
        'contract_id' => $contract->id,
        'opened_by' => $client->id,
        'reason' => 'Serviço contestado',
        'status' => DisputeStatus::Pending,
    ]);

    return [$dispute, $contract];
}
