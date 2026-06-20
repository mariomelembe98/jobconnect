<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdminStoreCategoryRequest;
use App\Http\Requests\Api\V1\Admin\AdminUpdateCategoryRequest;
use App\Http\Resources\AdminCategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->withCount(['serviceRequests', 'professionals', 'skills'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return ApiResponse::success(
            data: ['categories' => AdminCategoryResource::collection($categories->getCollection()), 'pagination' => $this->pagination($categories)],
            message: 'Categorias carregadas com sucesso.',
        );
    }

    public function store(AdminStoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] ??= Str::slug($data['name']);
        $category = Category::create($data)->loadCount(['serviceRequests', 'professionals', 'skills']);

        return ApiResponse::success(
            data: ['category' => new AdminCategoryResource($category)],
            message: 'Categoria criada com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function update(AdminUpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['name']) && ! isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $category->update($data);

        return ApiResponse::success(
            data: ['category' => new AdminCategoryResource($category->refresh()->loadCount(['serviceRequests', 'professionals', 'skills']))],
            message: 'Categoria actualizada com sucesso.',
        );
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->serviceRequests()->exists() || $category->professionals()->exists()) {
            return ApiResponse::error(
                message: 'A categoria está associada a pedidos de serviço ou profissionais. Desactive-a em vez de eliminar.',
                status: JsonResponse::HTTP_CONFLICT,
            );
        }

        $category->delete();

        return ApiResponse::success(message: 'Categoria eliminada com sucesso.');
    }

    /** @return array<string, int> */
    private function pagination(LengthAwarePaginator $paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'last_page' => $paginator->lastPage(), 'total' => $paginator->total()];
    }
}
