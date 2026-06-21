<?php

namespace Database\Seeders;

use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class PlaywrightSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            CategorySeeder::class,
            SkillSeeder::class,
        ]);

        $this->seedClient();
        $this->seedProfessional();
    }

    private function seedClient(): void
    {
        Role::findOrCreate('client');

        $user = User::updateOrCreate(
            ['email' => 'playwright.client@example.test'],
            [
                'name' => 'Client Playwright',
                'phone' => '+258840001001',
                'password' => Hash::make('password123'),
                'user_type' => UserType::Client,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
            ],
        );

        $user->syncRoles(['client']);
    }

    private function seedProfessional(): void
    {
        Role::findOrCreate('professional');

        $user = User::updateOrCreate(
            ['email' => 'playwright.professional@example.test'],
            [
                'name' => 'Professional Playwright',
                'phone' => '+258840001002',
                'password' => Hash::make('password123'),
                'user_type' => UserType::Professional,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
            ],
        );

        $user->syncRoles(['professional']);
    }
}
