<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        foreach ($this->categories() as $category) {
            DB::table('categories')->updateOrInsert(
                ['slug' => Str::slug($category)],
                [
                    'name' => $category,
                    'description' => null,
                    'icon' => null,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                    'deleted_at' => null,
                ],
            );
        }
    }

    /**
     * @return array<int, string>
     */
    private function categories(): array
    {
        return [
            'Informática',
            'Electricidade',
            'Canalização',
            'Construção Civil',
            'Limpeza',
            'Jardinagem',
            'Transporte',
            'Design',
            'Marketing',
            'Tradução',
            'Fotografia',
            'Educação',
            'Consultoria',
        ];
    }
}
