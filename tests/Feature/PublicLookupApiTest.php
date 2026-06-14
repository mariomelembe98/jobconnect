<?php

use App\Models\Category;
use App\Models\Skill;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can list active categories', function () {
    $category = Category::create(categoryPayload());

    $response = $this->getJson('/api/v1/categories');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Categorias carregadas com sucesso.')
        ->assertJsonPath('data.categories.0.id', $category->id)
        ->assertJsonPath('data.categories.0.name', 'Informática');
});

test('inactive categories are not listed', function () {
    Category::create(categoryPayload());
    Category::create(categoryPayload([
        'name' => 'Categoria Inactiva',
        'slug' => 'categoria-inactiva',
        'status' => 'inactive',
    ]));

    $response = $this->getJson('/api/v1/categories');

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.categories')
        ->assertJsonMissing(['name' => 'Categoria Inactiva']);
});

test('can list skills', function () {
    $category = Category::create(categoryPayload());
    $skill = Skill::create(skillPayload(['category_id' => $category->id]));

    $response = $this->getJson('/api/v1/skills');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Competências carregadas com sucesso.')
        ->assertJsonPath('data.skills.0.id', $skill->id)
        ->assertJsonPath('data.skills.0.category.id', $category->id);
});

test('can filter skills by category id', function () {
    $informatics = Category::create(categoryPayload());
    $design = Category::create(categoryPayload([
        'name' => 'Design',
        'slug' => 'design',
    ]));
    $support = Skill::create(skillPayload(['category_id' => $informatics->id]));
    Skill::create(skillPayload([
        'category_id' => $design->id,
        'name' => 'Design gráfico',
        'slug' => 'design-grafico',
    ]));

    $response = $this->getJson("/api/v1/skills?category_id={$informatics->id}");

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.skills')
        ->assertJsonPath('data.skills.0.id', $support->id)
        ->assertJsonMissing(['name' => 'Design gráfico']);
});

test('can list provinces', function () {
    $response = $this->getJson('/api/v1/locations/provinces');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Províncias carregadas com sucesso.')
        ->assertJsonFragment(['Maputo Cidade'])
        ->assertJsonFragment(['Nampula']);
});

test('can list cities', function () {
    $response = $this->getJson('/api/v1/locations/cities');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Cidades carregadas com sucesso.')
        ->assertJsonFragment(['Matola'])
        ->assertJsonFragment(['Beira']);
});

test('can filter cities by province', function () {
    $response = $this->getJson('/api/v1/locations/cities?province=Maputo%20Cidade');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonFragment(['KaMpfumo'])
        ->assertJsonMissing(['Matola']);
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function categoryPayload(array $overrides = []): array
{
    return [
        'name' => 'Informática',
        'slug' => 'informatica',
        'description' => 'Serviços de informática.',
        'icon' => 'laptop',
        'status' => 'active',
        ...$overrides,
    ];
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function skillPayload(array $overrides = []): array
{
    return [
        'name' => 'Suporte técnico',
        'slug' => 'suporte-tecnico',
        'description' => 'Suporte técnico geral.',
        ...$overrides,
    ];
}
