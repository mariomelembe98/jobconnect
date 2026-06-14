<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SkillSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        $categoryIdsBySlug = DB::table('categories')
            ->pluck('id', 'slug');

        foreach ($this->skillsByCategory() as $category => $skills) {
            $categorySlug = Str::slug($category);
            $categoryId = $categoryIdsBySlug->get($categorySlug);

            if ($categoryId === null) {
                $this->command?->warn("Category [{$category}] was not found. Its skills were skipped.");

                continue;
            }

            foreach ($skills as $skill) {
                DB::table('skills')->updateOrInsert(
                    ['slug' => Str::slug($skill)],
                    [
                        'category_id' => $categoryId,
                        'name' => $skill,
                        'description' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                        'deleted_at' => null,
                    ],
                );
            }
        }
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function skillsByCategory(): array
    {
        return [
            'Informática' => [
                'Reparação de computadores',
                'Instalação de redes',
                'Suporte técnico',
            ],
            'Electricidade' => [
                'Instalação eléctrica',
                'Reparação de avarias',
                'Manutenção eléctrica',
            ],
            'Canalização' => [
                'Reparação de fugas',
                'Instalação de canalização',
                'Desentupimento',
            ],
            'Construção Civil' => [
                'Alvenaria',
                'Pintura de edifícios',
                'Reabilitação de casas',
            ],
            'Limpeza' => [
                'Limpeza doméstica',
                'Limpeza pós-obra',
                'Limpeza de escritórios',
            ],
            'Jardinagem' => [
                'Manutenção de jardins',
                'Corte de relva',
                'Paisagismo',
            ],
            'Transporte' => [
                'Mudanças residenciais',
                'Transporte de mercadorias',
                'Serviço de entregas',
            ],
            'Design' => [
                'Design gráfico',
                'Design de logótipos',
                'Design para redes sociais',
            ],
            'Marketing' => [
                'Gestão de redes sociais',
                'Marketing digital',
                'Campanhas publicitárias',
            ],
            'Tradução' => [
                'Tradução português-inglês',
                'Tradução juramentada',
                'Revisão de textos',
            ],
            'Fotografia' => [
                'Fotografia de eventos',
                'Fotografia de produtos',
                'Edição de fotografias',
            ],
            'Educação' => [
                'Aulas particulares',
                'Explicação escolar',
                'Formação profissional',
            ],
            'Consultoria' => [
                'Consultoria empresarial',
                'Consultoria financeira',
                'Consultoria de recursos humanos',
            ],
        ];
    }
}
