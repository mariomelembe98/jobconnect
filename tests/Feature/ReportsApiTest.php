<?php

use App\Enums\ReportReason;
use App\Enums\ReportType;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('authenticated user can create report', function () {
    $reporter = reportsUser();
    $reported = reportsUser();
    Sanctum::actingAs($reporter);

    $response = $this->postJson('/api/v1/reports', [
        'report_type' => ReportType::User->value,
        'reported_user_id' => $reported->id,
        'reason' => ReportReason::FakeProfile->value,
        'description' => 'O perfil apresenta informações que não parecem verdadeiras.',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Denúncia criada com sucesso.')
        ->assertJsonPath('data.report.reporter_id', $reporter->id)
        ->assertJsonPath('data.report.reported_user_id', $reported->id)
        ->assertJsonPath('data.report.status', 'pending');

    $this->assertDatabaseHas('reports', [
        'reporter_id' => $reporter->id,
        'reported_user_id' => $reported->id,
        'report_type' => ReportType::User->value,
    ]);
});

test('user can list own reports', function () {
    $user = reportsUser();
    Report::create([
        'reporter_id' => $user->id,
        'reported_user_id' => reportsUser()->id,
        'report_type' => ReportType::User,
        'reason' => ReportReason::Spam,
    ]);
    Report::create([
        'reporter_id' => reportsUser()->id,
        'reported_user_id' => $user->id,
        'report_type' => ReportType::User,
        'reason' => ReportReason::Abuse,
    ]);
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/reports/me')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.reports')
        ->assertJsonPath('data.reports.0.reporter_id', $user->id);
});

test('user cannot view another users report', function () {
    $report = Report::create([
        'reporter_id' => reportsUser()->id,
        'reported_user_id' => reportsUser()->id,
        'report_type' => ReportType::User,
        'reason' => ReportReason::Fraud,
    ]);
    Sanctum::actingAs(reportsUser());

    $this->getJson("/api/v1/reports/{$report->id}")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Sem permissão para ver esta denúncia.');
});

test('admin can view reports', function () {
    $report = Report::create([
        'reporter_id' => reportsUser()->id,
        'reported_user_id' => reportsUser()->id,
        'report_type' => ReportType::User,
        'reason' => ReportReason::Other,
    ]);
    Sanctum::actingAs(reportsAdmin());

    $this->getJson("/api/v1/reports/{$report->id}")
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.report.id', $report->id);
});

function reportsUser(): User
{
    return User::factory()->client()->create([
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
    ]);
}

function reportsAdmin(): User
{
    Role::findOrCreate('admin');
    $admin = User::factory()->admin()->create([
        'user_type' => UserType::Admin,
        'status' => UserStatus::Active,
    ]);
    $admin->assignRole('admin');

    return $admin;
}
