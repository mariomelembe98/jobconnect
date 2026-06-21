<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Auth/Login'));

Route::get('/login', fn () => Inertia::render('Auth/Login'))->name('login');
Route::get('/register', fn () => Inertia::render('Auth/Register'))->name('register');
Route::get('/reviews/me', fn () => Inertia::render('Reviews/Index'))->name('reviews.me');
Route::get('/reports', fn () => Inertia::render('Reports/Index'))->name('reports.index');
Route::get('/disputes', fn () => Inertia::render('Disputes/Index'))->name('disputes.index');
Route::get('/disputes/{dispute}', fn (string $dispute) => Inertia::render('Disputes/Show', [
    'disputeId' => (int) $dispute,
]))->whereNumber('dispute')->name('disputes.show');
Route::get('/notifications', fn () => Inertia::render('Notifications/Index'))->name('notifications.index');
Route::get('/conversations', fn () => Inertia::render('Conversations/Index'))->name('conversations.index');
Route::get('/conversations/{conversation}', fn (string $conversation) => Inertia::render('Conversations/Show', [
    'conversationId' => (int) $conversation,
]))->whereNumber('conversation')->name('conversations.show');
Route::get('/contracts', fn () => Inertia::render('Contracts/Index'))->name('contracts.index');
Route::get('/contracts/{contract}', fn (string $contract) => Inertia::render('Contracts/Show', [
    'contractId' => (int) $contract,
]))->whereNumber('contract')->name('contracts.show');
Route::get('/professionals', fn () => Inertia::render('Professionals/Index'))->name('professionals.index');
Route::get('/professionals/{professionalProfile}', fn (string $professionalProfile) => Inertia::render('Professionals/Show', [
    'professionalProfileId' => (int) $professionalProfile,
]))->whereNumber('professionalProfile')->name('professionals.show');
Route::get('/client', fn () => Inertia::render('Client/Dashboard'))->name('client.dashboard');
Route::get('/client/service-requests/create', fn () => Inertia::render('Client/ServiceRequests/Create'))->name('client.service_requests.create');
Route::get('/client/service-requests', fn () => Inertia::render('Client/ServiceRequests/Index'))->name('client.service_requests.index');
Route::get('/client/service-requests/{serviceRequest}', fn (string $serviceRequest) => Inertia::render('Client/ServiceRequests/Show', [
    'serviceRequestId' => (int) $serviceRequest,
]))->whereNumber('serviceRequest')->name('client.service_requests.show');
Route::get('/professional', fn () => Inertia::render('Professional/Dashboard'))->name('professional.dashboard');
Route::get('/professional/onboarding', fn () => Inertia::render('Professional/Onboarding'))->name('professional.onboarding');
Route::get('/professional/profile', fn () => Inertia::render('Professional/Profile'))->name('professional.profile');
Route::get('/professional/proposals', fn () => Inertia::render('Professional/Proposals/Index'))->name('professional.proposals.index');
Route::get('/professional/jobs', fn () => Inertia::render('Professional/Jobs/Index'))->name('professional.jobs.index');
Route::get('/professional/jobs/{serviceRequest}', fn (string $serviceRequest) => Inertia::render('Professional/Jobs/Show', [
    'serviceRequestId' => (int) $serviceRequest,
]))->whereNumber('serviceRequest')->name('professional.jobs.show');
Route::get('/admin', fn () => Inertia::render('Admin/Dashboard'))->name('admin.dashboard');
Route::get('/admin/activity-logs', fn () => Inertia::render('Admin/ActivityLogs'))->name('admin.activity_logs.index');
Route::get('/admin/users', fn () => Inertia::render('Admin/Users'))->name('admin.users.index');
Route::get('/admin/verifications', fn () => Inertia::render('Admin/Verifications'))->name('admin.verifications.index');
Route::get('/admin/reports', fn () => Inertia::render('Admin/Reports'))->name('admin.reports.index');
Route::get('/admin/disputes', fn () => Inertia::render('Admin/Disputes'))->name('admin.disputes.index');
