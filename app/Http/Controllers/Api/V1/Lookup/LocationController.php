<?php

namespace App\Http\Controllers\Api\V1\Lookup;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function provinces(): JsonResponse
    {
        return ApiResponse::success(
            data: [
                'provinces' => array_keys($this->locations()),
            ],
            message: 'Províncias carregadas com sucesso.',
        );
    }

    public function cities(Request $request): JsonResponse
    {
        $province = $request->query('province');
        $locations = $this->locations();

        $cities = is_string($province) && $province !== ''
            ? ($locations[$province] ?? [])
            : collect($locations)->flatten()->values()->all();

        return ApiResponse::success(
            data: [
                'cities' => $cities,
            ],
            message: 'Cidades carregadas com sucesso.',
        );
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function locations(): array
    {
        return [
            'Cabo Delgado' => ['Pemba', 'Montepuez', 'Mocímboa da Praia'],
            'Gaza' => ['Xai-Xai', 'Chókwè', 'Chibuto'],
            'Inhambane' => ['Inhambane', 'Maxixe', 'Vilankulo'],
            'Manica' => ['Chimoio', 'Manica', 'Gondola'],
            'Maputo Cidade' => ['KaMpfumo', 'Nlhamankulu', 'KaMaxakeni', 'KaMavota', 'KaMubukwana', 'KaTembe', 'KaNyaka'],
            'Maputo Província' => ['Matola', 'Boane', 'Namaacha', 'Marracuene'],
            'Nampula' => ['Nampula', 'Nacala', 'Angoche'],
            'Niassa' => ['Lichinga', 'Cuamba', 'Marrupa'],
            'Sofala' => ['Beira', 'Dondo', 'Gorongosa'],
            'Tete' => ['Tete', 'Moatize', 'Angónia'],
            'Zambézia' => ['Quelimane', 'Mocuba', 'Gurué'],
        ];
    }
}
