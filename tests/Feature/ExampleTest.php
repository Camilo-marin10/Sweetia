<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * "/" hands off to the events dashboard, which itself requires auth.
     */
    public function test_the_application_redirects_to_events(): void
    {
        $response = $this->get('/');

        $response->assertRedirect(route('events.index'));
    }
}
