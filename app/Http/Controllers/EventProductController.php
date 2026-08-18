<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventProduct;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EventProductController extends Controller
{
    public function store(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity_made' => ['required', 'integer', 'min:1'],
            'unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $event->eventProducts()->create($data);

        return back()->with('success', 'Producto agregado al evento.');
    }

    public function update(Request $request, EventProduct $eventProduct): RedirectResponse
    {
        $data = $request->validate([
            'quantity_made' => ['required', 'integer', 'min:'.$eventProduct->quantity_sold],
            'unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $eventProduct->update($data);

        return back()->with('success', 'Producto del evento actualizado.');
    }

    public function destroy(EventProduct $eventProduct): RedirectResponse
    {
        if ($eventProduct->quantity_sold > 0) {
            return back()->with('error', 'No se puede quitar un producto que ya tiene ventas registradas.');
        }

        $eventProduct->delete();

        return back()->with('success', 'Producto quitado del evento.');
    }
}
