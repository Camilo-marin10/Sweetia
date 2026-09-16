<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_the_product_catalog(): void
    {
        $response = $this->get('/products');

        $response->assertRedirect('/login');
    }

    public function test_regular_sellers_cannot_manage_the_product_catalog(): void
    {
        $seller = User::factory()->create(['role' => 'vendedor']);

        $this->actingAs($seller)->get('/products')->assertForbidden();

        $this->actingAs($seller)->post('/products', [
            'name' => 'Postre nuevo',
        ])->assertForbidden();
    }

    public function test_admins_can_manage_the_product_catalog(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/products')->assertOk();

        $this->actingAs($admin)->post('/products', [
            'name' => 'Postre nuevo',
        ])->assertRedirect();

        $this->assertDatabaseHas('products', ['name' => 'Postre nuevo']);
    }

    public function test_regular_sellers_can_still_use_the_events_workspace(): void
    {
        Product::create(['name' => 'Postre limón']);
        $seller = User::factory()->create(['role' => 'vendedor']);

        $this->actingAs($seller)->get('/events')->assertOk();
    }
}
