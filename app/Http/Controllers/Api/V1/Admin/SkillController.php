<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdminStoreSkillRequest;
use App\Http\Requests\Api\V1\Admin\AdminUpdateSkillRequest;
use App\Http\Resources\AdminSkillResource;
use App\Models\Skill;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class SkillController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $skills = Skill::query()
            ->with('category')
            ->withCount('professionals')
            ->when($request->filled('category_id'), fn ($query) => $query->where('category_id', $request->integer('category_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return ApiResponse::success(
            data: ['skills' => AdminSkillResource::collection($skills->getCollection()), 'pagination' => $this->pagination($skills)],
            message: 'Competências carregadas com sucesso.',
        );
    }

    public function store(AdminStoreSkillRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] ??= Str::slug($data['name']);
        $skill = Skill::create($data)->load('category')->loadCount('professionals');

        return ApiResponse::success(
            data: ['skill' => new AdminSkillResource($skill)],
            message: 'Competência criada com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function update(AdminUpdateSkillRequest $request, Skill $skill): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['name']) && ! isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $skill->update($data);

        return ApiResponse::success(
            data: ['skill' => new AdminSkillResource($skill->refresh()->load('category')->loadCount('professionals'))],
            message: 'Competência actualizada com sucesso.',
        );
    }

    public function destroy(Skill $skill): JsonResponse
    {
        if ($skill->professionals()->exists()) {
            return ApiResponse::error(
                message: 'A competência está associada a profissionais. Desactive-a em vez de eliminar.',
                status: JsonResponse::HTTP_CONFLICT,
            );
        }

        $skill->delete();

        return ApiResponse::success(message: 'Competência eliminada com sucesso.');
    }

    /** @return array<string, int> */
    private function pagination(LengthAwarePaginator $paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'last_page' => $paginator->lastPage(), 'total' => $paginator->total()];
    }
}
