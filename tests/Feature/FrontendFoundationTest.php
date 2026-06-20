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
    'home' => ['/', 'Auth/Login'],
    'login' => ['/login', 'Auth/Login'],
    'register' => ['/register', 'Auth/Register'],
    'client dashboard' => ['/client', 'Client/Dashboard'],
    'professional dashboard' => ['/professional', 'Professional/Dashboard'],
    'admin dashboard' => ['/admin', 'Admin/Dashboard'],
]);
