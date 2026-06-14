<?php

use App\Enums\UserType;
use App\Models\Category;
use App\Models\ProfessionalProfile;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can create client user with factory', function () {
    $user = User::factory()->client()->create();

    expect($user)->toBeInstanceOf(User::class)
        ->and($user->user_type)->toBe(UserType::Client);
});

test('can create professional user with factory', function () {
    $user = User::factory()->professional()->create();

    expect($user)->toBeInstanceOf(User::class)
        ->and($user->user_type)->toBe(UserType::Professional);
});

test('can create category with factory', function () {
    $category = Category::factory()->create();

    expect($category)->toBeInstanceOf(Category::class)
        ->and($category->status)->toBe('active');
});

test('can create skill with factory', function () {
    $skill = Skill::factory()->create();

    expect($skill)->toBeInstanceOf(Skill::class)
        ->and($skill->category)->toBeInstanceOf(Category::class);
});

test('can create professional profile with related user', function () {
    $profile = ProfessionalProfile::factory()->create();

    expect($profile)->toBeInstanceOf(ProfessionalProfile::class)
        ->and($profile->user)->toBeInstanceOf(User::class)
        ->and($profile->user->user_type)->toBe(UserType::Professional);
});

test('professional profile can attach category and skill', function () {
    $profile = ProfessionalProfile::factory()->create();
    $category = Category::factory()->create();
    $skill = Skill::factory()->for($category)->create();

    $profile->categories()->attach($category);
    $profile->skills()->attach($skill);

    expect($profile->categories()->first()->is($category))->toBeTrue()
        ->and($profile->skills()->first()->is($skill))->toBeTrue();
});
