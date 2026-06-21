<?php

use App\Enums\ProposalStatus;
use App\Enums\ReportReason;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Contract;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\Report;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\ActivityLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('auth login endpoint is rate limited after ten attempts from the same ip', function () {
    $user = activityLogRateLimitUser();

    for ($attempt = 0; $attempt < 10; $attempt++) {
        $this->postJson('/api/v1/auth/login', [
            'identifier' => $user->email,
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'wrong-password',
    ])
        ->assertTooManyRequests()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.');
});

test('successful login creates activity log', function () {
    $user = activityLogRateLimitUser();

    $response = $this->postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'password',
    ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $user->id,
        'action' => 'user_login',
        'module' => 'auth',
        'subject_type' => User::class,
        'subject_id' => $user->id,
    ]);
});

test('logout creates activity log', function () {
    $user = activityLogRateLimitUser();
    $token = $user->createToken('audit-token')->plainTextToken;

    $this->withToken($token)
        ->postJson('/api/v1/auth/logout')
        ->assertSuccessful();

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $user->id,
        'action' => 'user_logout',
        'module' => 'auth',
        'subject_type' => User::class,
        'subject_id' => $user->id,
    ]);
});

test('message endpoint is rate limited after thirty attempts', function () {
    [$client, $professional, $conversation] = activityLogConversationParticipants();
    Sanctum::actingAs($client);

    for ($attempt = 0; $attempt < 30; $attempt++) {
        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'message' => 'Mensagem de teste '.$attempt,
        ])->assertSuccessful();
    }

    $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
        'message' => 'Mensagem que excede o limite',
    ])
        ->assertTooManyRequests()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Demasiadas mensagens. Aguarde um momento e tente novamente.');
});

test('creating service request creates activity log', function () {
    $client = activityLogClientUser();
    Sanctum::actingAs($client);
    $category = Category::factory()->create();

    $response = $this->postJson('/api/v1/service-requests', activityLogServiceRequestPayload($category));

    $response
        ->assertCreated()
        ->assertJsonPath('success', true);

    $serviceRequest = ServiceRequest::query()->latest('id')->firstOrFail();

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $client->id,
        'action' => 'service_request_created',
        'module' => 'service_requests',
        'subject_type' => ServiceRequest::class,
        'subject_id' => $serviceRequest->id,
    ]);

    $log = ActivityLog::query()->where('action', 'service_request_created')->latest('id')->firstOrFail();

    expect($log->metadata)->toMatchArray([
        'service_request_id' => $serviceRequest->id,
        'category_id' => $category->id,
    ]);
});

test('cancelling service request creates activity log', function () {
    $client = activityLogClientUser();
    $serviceRequest = activityLogServiceRequest($client);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/service-requests/{$serviceRequest->id}/cancel")
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $client->id,
        'action' => 'service_request_cancelled',
        'module' => 'service_requests',
        'subject_type' => ServiceRequest::class,
        'subject_id' => $serviceRequest->id,
    ]);
});

test('accepting proposal creates activity log', function () {
    $client = activityLogClientUser();
    $professional = activityLogProfessionalUser();
    $serviceRequest = activityLogServiceRequest($client);
    $proposal = activityLogProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/proposals/{$proposal->id}/accept");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $client->id,
        'action' => 'proposal_accepted',
        'module' => 'proposals',
        'subject_type' => Contract::class,
        'subject_id' => $contract->id,
    ]);

    $log = ActivityLog::query()->where('action', 'proposal_accepted')->latest('id')->firstOrFail();

    expect($log->metadata)->toMatchArray([
        'contract_id' => $contract->id,
        'proposal_id' => $proposal->id,
        'service_request_id' => $serviceRequest->id,
    ]);
});

test('submitting proposal creates activity log', function () {
    $client = activityLogClientUser();
    $professional = activityLogProfessionalUser();
    $serviceRequest = activityLogServiceRequest($client);
    Sanctum::actingAs($professional);

    $response = $this->postJson('/api/v1/proposals', [
        'service_request_id' => $serviceRequest->id,
        'amount' => 275,
        'delivery_days' => 5,
        'message' => 'Tenho disponibilidade imediata para este pedido.',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true);

    $proposal = Proposal::query()->latest('id')->firstOrFail();

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $professional->id,
        'action' => 'proposal_submitted',
        'module' => 'proposals',
        'subject_type' => Proposal::class,
        'subject_id' => $proposal->id,
    ]);
});

test('completing contract creates activity log', function () {
    $client = activityLogClientUser();
    $professional = activityLogProfessionalUser();
    $serviceRequest = activityLogServiceRequest($client);
    $proposal = activityLogProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->postJson("/api/v1/contracts/{$contract->id}/complete")
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $client->id,
        'action' => 'contract_completed',
        'module' => 'contracts',
        'subject_type' => Contract::class,
        'subject_id' => $contract->id,
    ]);
});

test('cancelling contract creates activity log', function () {
    $client = activityLogClientUser();
    $professional = activityLogProfessionalUser();
    $serviceRequest = activityLogServiceRequest($client);
    $proposal = activityLogProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->postJson("/api/v1/contracts/{$contract->id}/cancel")
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $client->id,
        'action' => 'contract_cancelled',
        'module' => 'contracts',
        'subject_type' => Contract::class,
        'subject_id' => $contract->id,
    ]);
});

test('admin blocking user creates activity log', function () {
    $user = activityLogClientUser();
    $admin = activityLogAdminUser();
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/users/{$user->id}/block")
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $admin->id,
        'action' => 'user_blocked',
        'module' => 'users',
        'subject_type' => User::class,
        'subject_id' => $user->id,
    ]);
});

test('admin suspending user creates activity log', function () {
    $user = activityLogClientUser();
    $admin = activityLogAdminUser();
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/users/{$user->id}/suspend", [
        'reason' => 'Análise de segurança',
    ])->assertSuccessful();

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $admin->id,
        'action' => 'user_suspended',
        'module' => 'users',
        'subject_type' => User::class,
        'subject_id' => $user->id,
    ]);
});

test('verification approve and reject create activity logs', function () {
    $admin = activityLogAdminUser('super_admin');
    $approvedProfile = activityLogProfessionalProfile([
        'verification_status' => VerificationStatus::Pending,
    ]);
    activityLogProfessionalDocument($approvedProfile, [
        'document_type' => 'bi',
        'status' => 'pending',
    ]);

    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/verifications/{$approvedProfile->id}/approve")
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $admin->id,
        'action' => 'verification_approved',
        'module' => 'verifications',
        'subject_type' => ProfessionalProfile::class,
        'subject_id' => $approvedProfile->id,
    ]);

    $rejectedProfile = activityLogProfessionalProfile([
        'verification_status' => VerificationStatus::Pending,
    ]);
    activityLogProfessionalDocument($rejectedProfile, [
        'document_type' => 'nuit',
        'status' => 'pending',
    ]);

    $this->postJson("/api/v1/admin/verifications/{$rejectedProfile->id}/reject", [
        'reason' => 'Documentação incompleta.',
    ])
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $admin->id,
        'action' => 'verification_rejected',
        'module' => 'verifications',
        'subject_type' => ProfessionalProfile::class,
        'subject_id' => $rejectedProfile->id,
    ]);
});

test('creating report creates activity log', function () {
    $actor = activityLogClientUser();
    $reportedUser = activityLogProfessionalUser();
    Sanctum::actingAs($actor);

    $this->postJson('/api/v1/reports', [
        'report_type' => 'user',
        'reported_user_id' => $reportedUser->id,
        'reason' => ReportReason::Spam->value,
        'description' => 'Descrição confidencial que não deve ser persistida integralmente.',
    ])->assertSuccessful();

    $report = Report::query()->latest('id')->firstOrFail();

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $actor->id,
        'action' => 'report_created',
        'module' => 'reports',
        'subject_type' => Report::class,
        'subject_id' => $report->id,
    ]);
});

test('creating dispute creates activity log', function () {
    $client = activityLogClientUser();
    $professional = activityLogProfessionalUser();
    $serviceRequest = activityLogServiceRequest($client);
    $proposal = activityLogProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->postJson('/api/v1/disputes', [
        'contract_id' => $contract->id,
        'reason' => 'O serviço não corresponde ao acordado.',
        'description' => 'Descrição detalhada do problema que não deve ser exposta.',
    ])->assertSuccessful();

    $dispute = Dispute::query()->latest('id')->firstOrFail();

    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $client->id,
        'action' => 'dispute_created',
        'module' => 'disputes',
        'subject_type' => Dispute::class,
        'subject_id' => $dispute->id,
    ]);
});

test('sensitive data is not logged', function () {
    $user = activityLogClientUser();
    $service = app(ActivityLogService::class);

    $log = $service->record($user, 'sensitive_event', 'security', null, [
        'password' => 'secret-password',
        'token' => 'secret-token',
        'file_path' => 'verification-documents/1/private.pdf',
        'message' => 'sensitive message',
        'description' => 'full description',
        'safe' => 'kept',
        'nested' => [
            'body' => 'secret body',
            'safe_nested' => 'also kept',
        ],
    ]);

    expect($log->metadata)->toBe([
        'safe' => 'kept',
        'nested' => [
            'safe_nested' => 'also kept',
        ],
    ]);

    $this->assertDatabaseHas('activity_logs', [
        'id' => $log->id,
        'action' => 'sensitive_event',
        'module' => 'security',
    ]);
});

function activityLogRateLimitUser(): User
{
    return User::factory()->client()->create([
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
        'email' => 'ratelimit@example.test',
        'phone' => '+258840099999',
    ]);
}

function activityLogClientUser(array $overrides = []): User
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

function activityLogProfessionalUser(array $overrides = []): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
        ...$overrides,
    ]);
    $user->assignRole('professional');
    $user->professionalProfile()->create(activityLogProfessionalProfileAttributes());

    return $user->fresh(['professionalProfile']);
}

function activityLogAdminUser(string $role = 'admin'): User
{
    Role::findOrCreate($role);

    $user = User::factory()->admin()->create([
        'user_type' => UserType::Admin,
        'status' => UserStatus::Active,
    ]);
    $user->assignRole($role);

    return $user;
}

function activityLogProfessionalProfile(array $overrides = []): ProfessionalProfile
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
    ]);
    $user->assignRole('professional');

    return $user->professionalProfile()->create([
        ...activityLogProfessionalProfileAttributes(),
        ...$overrides,
    ]);
}

function activityLogProfessionalProfileAttributes(): array
{
    return [
        'headline' => 'Técnico de confiança',
        'bio' => 'Profissional com experiência em manutenção e instalação.',
        'experience_years' => 5,
        'base_price' => 1500,
        'price_type' => 'fixed',
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        'address' => 'Avenida Julius Nyerere',
        'latitude' => -25.9653,
        'longitude' => 32.5892,
        'verification_status' => VerificationStatus::Pending,
    ];
}

function activityLogProfessionalDocument(ProfessionalProfile $profile, array $overrides = []): void
{
    $profile->documents()->create([
        'document_type' => 'bi',
        'file_path' => "verification-documents/{$profile->id}/sample.pdf",
        'file_name' => 'sample.pdf',
        'file_type' => 'application/pdf',
        'file_size' => 128,
        'status' => 'pending',
        ...$overrides,
    ]);
}

function activityLogServiceRequest(User $client): ServiceRequest
{
    return ServiceRequest::create([
        'client_id' => $client->id,
        'category_id' => Category::factory()->create()->id,
        'title' => 'Pedido de teste para auditoria',
        'description' => 'Descrição suficientemente longa para passar validação e simular o pedido.',
        'service_type' => 'local',
        'budget_min' => 100,
        'budget_max' => 300,
        'budget_type' => 'fixed',
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        'address' => 'Rua de teste',
        'deadline_at' => now()->addDays(7),
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
}

function activityLogServiceRequestPayload(Category $category): array
{
    return [
        'category_id' => $category->id,
        'title' => 'Pedido de serviço para auditoria',
        'description' => 'Descrição suficientemente longa para passar validação e simular o pedido.',
        'service_type' => 'local',
        'budget_min' => 100,
        'budget_max' => 300,
        'budget_type' => 'fixed',
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        'address' => 'Rua de teste',
        'deadline_at' => now()->addDays(7)->toISOString(),
        'visibility' => 'public',
    ];
}

function activityLogProposal(User $professional, ServiceRequest $serviceRequest): Proposal
{
    return Proposal::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 250,
        'delivery_days' => 4,
        'message' => 'Tenho experiência neste tipo de trabalho.',
        'status' => ProposalStatus::Pending,
    ]);
}

/**
 * @return array{0: User, 1: User, 2: Conversation}
 */
function activityLogConversationParticipants(): array
{
    $client = activityLogClientUser();
    $professional = activityLogProfessionalUser();
    $serviceRequest = activityLogServiceRequest($client);
    $conversation = Conversation::create([
        'service_request_id' => $serviceRequest->id,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'status' => 'active',
    ]);

    return [$client, $professional, $conversation];
}
