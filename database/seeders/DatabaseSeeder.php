<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Mariajosilla',
            'email' => 'callemajo123@gmail.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
    }
}
