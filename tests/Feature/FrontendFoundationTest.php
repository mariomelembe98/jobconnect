<?php

use Inertia\Testing\AssertableInertia as Assert;

test('frontend foundation routes render their inertia pages', function (string $uri, string $component) {
    $this->get($uri)
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->has('appName')
            ->has('auth.user')
        );
})->with([
    'home' => ['/', 'Landing'],
    'help' => ['/help', 'Help'],
    'terms' => ['/terms', 'Legal/Terms'],
    'privacy' => ['/privacy', 'Legal/Privacy'],
    'login' => ['/login', 'Auth/Login'],
    'register' => ['/register', 'Auth/Register'],
    'settings' => ['/settings', 'Settings'],
    'my reviews' => ['/reviews/me', 'Reviews/Index'],
    'reports' => ['/reports', 'Reports/Index'],
    'disputes' => ['/disputes', 'Disputes/Index'],
    'notifications' => ['/notifications', 'Notifications/Index'],
    'conversations' => ['/conversations', 'Conversations/Index'],
    'contracts' => ['/contracts', 'Contracts/Index'],
    'professional directory' => ['/professionals', 'Professionals/Index'],
    'client dashboard' => ['/client', 'Client/Dashboard'],
    'client service requests' => ['/client/service-requests', 'Client/ServiceRequests/Index'],
    'create service request' => ['/client/service-requests/create', 'Client/ServiceRequests/Create'],
    'professional dashboard' => ['/professional', 'Professional/Dashboard'],
    'professional proposals' => ['/professional/proposals', 'Professional/Proposals/Index'],
    'professional jobs' => ['/professional/jobs', 'Professional/Jobs/Index'],
    'admin dashboard' => ['/admin', 'Admin/Dashboard'],
]);

test('professional detail route passes the profile identifier', function () {
    $this->get('/professionals/42')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Professionals/Show')
            ->where('professionalProfileId', 42)
        );
});

test('contract detail route passes the contract identifier', function () {
    $this->get('/contracts/64')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Contracts/Show')
            ->where('contractId', 64)
        );
});

test('conversation detail route passes the conversation identifier', function () {
    $this->get('/conversations/28')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Conversations/Show')
            ->where('conversationId', 28)
        );
});

test('dispute detail route passes the dispute identifier', function () {
    $this->get('/disputes/57')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Disputes/Show')
            ->where('disputeId', 57)
        );
});

test('client service request detail route passes the request identifier', function () {
    $this->get('/client/service-requests/73')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Client/ServiceRequests/Show')
            ->where('serviceRequestId', 73)
        );
});

test('professional job detail route passes the service request identifier', function () {
    $this->get('/professional/jobs/91')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Professional/Jobs/Show')
            ->where('serviceRequestId', 91)
        );
});
