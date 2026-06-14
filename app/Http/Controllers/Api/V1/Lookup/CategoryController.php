<?php

namespace App\Http\Controllers\Api\V1\Lookup;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return ApiResponse::success(
            data: [
                'categories' => CategoryResource::collection($categories),
            ],
            message: 'Categorias carregadas com sucesso.',
        );
    }
}
