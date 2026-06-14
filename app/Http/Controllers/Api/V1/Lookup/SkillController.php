<?php

namespace App\Http\Controllers\Api\V1\Lookup;

use App\Http\Controllers\Controller;
use App\Http\Resources\SkillResource;
use App\Models\Skill;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $skills = Skill::query()
            ->with('category')
            ->whereHas('category', fn ($query) => $query->where('status', 'active'))
            ->when(
                $request->filled('category_id'),
                fn ($query) => $query->where('category_id', $request->integer('category_id')),
            )
            ->orderBy('name')
            ->get();

        return ApiResponse::success(
            data: [
                'skills' => SkillResource::collection($skills),
            ],
            message: 'Competências carregadas com sucesso.',
        );
    }
}
