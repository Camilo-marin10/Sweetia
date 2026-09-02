<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventProduct;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    public function store(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.event_product_id' => [
                'required',
                'distinct',
                Rule::exists('event_products', 'id')->where('event_id', $event->id),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        try {
            DB::transaction(function () use ($data, $event, $request) {
                // Every line of the same checkout shares a group_id so the UI can
                // present them as one order while stock/reports still see each
                // product's own Sale row.
                $groupId = Str::uuid()->toString();

                foreach ($data['items'] as $item) {
                    // Lock the event_product row so two concurrent sales can't both
                    // pass the stock check before either one commits its insert.
                    $eventProduct = EventProduct::where('id', $item['event_product_id'])
                        ->where('event_id', $event->id)
                        ->lockForUpdate()
                        ->with('product')
                        ->firstOrFail();

                    $sold = $eventProduct->sales()->sum('quantity');
                    $available = $eventProduct->quantity_made - $sold;

                    if ($item['quantity'] > $available) {
                        throw ValidationException::withMessages([
                            'items' => "Solo quedan {$available} unidades de \"{$eventProduct->product->name}\" disponibles.",
                        ]);
                    }

                    Sale::create([
                        'event_id' => $event->id,
                        'group_id' => $groupId,
                        'event_product_id' => $eventProduct->id,
                        'customer_name' => $data['customer_name'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $eventProduct->unit_price,
                        'total' => $eventProduct->unit_price * $item['quantity'],
                        'paid' => false,
                        'sold_by' => $request->user()->id,
                    ]);
                }
            });
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Venta registrada.');
    }

    public function update(Request $request, Sale $sale): RedirectResponse
    {
        $data = $request->validate([
            'paid' => ['sometimes', 'boolean'],
            'payment_method' => ['required_if:paid,true', 'nullable', 'in:Efectivo,Nequi'],
            'delivered' => ['sometimes', 'boolean'],
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
        ]);

        try {
            DB::transaction(function () use ($sale, $data) {
                $payload = $this->saleUpdatePayload($data);

                if (array_key_exists('quantity', $data)) {
                    $payload = [...$payload, ...$this->quantityUpdatePayload($sale, $data['quantity'])];
                }

                $sale->update($payload);
            });
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Venta actualizada.');
    }

    public function destroy(Sale $sale): RedirectResponse
    {
        $sale->delete();

        return back()->with('success', 'Venta anulada, stock repuesto.');
    }

    public function updateGroup(Request $request, string $groupId): RedirectResponse
    {
        $data = $request->validate([
            'paid' => ['sometimes', 'boolean'],
            'payment_method' => ['required_if:paid,true', 'nullable', 'in:Efectivo,Nequi'],
            'delivered' => ['sometimes', 'boolean'],
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.id' => ['required_with:items', Rule::exists('sales', 'id')->where('group_id', $groupId)],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
        ]);

        try {
            DB::transaction(function () use ($groupId, $data) {
                $payload = $this->saleUpdatePayload($data);

                if (! empty($payload)) {
                    Sale::where('group_id', $groupId)->update($payload);
                }

                foreach ($data['items'] ?? [] as $item) {
                    $sale = Sale::where('id', $item['id'])->where('group_id', $groupId)->lockForUpdate()->firstOrFail();
                    $sale->update($this->quantityUpdatePayload($sale, $item['quantity']));
                }
            });
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Venta actualizada.');
    }

    public function destroyGroup(string $groupId): RedirectResponse
    {
        Sale::where('group_id', $groupId)->delete();

        return back()->with('success', 'Venta anulada, stock repuesto.');
    }

    /**
     * Only touch the columns the request actually sent, so e.g. a delivery-status
     * toggle doesn't also overwrite the unrelated payment state.
     */
    private function saleUpdatePayload(array $data): array
    {
        $payload = [];

        if (array_key_exists('paid', $data)) {
            $payload['paid'] = $data['paid'];
            $payload['payment_method'] = $data['paid'] ? ($data['payment_method'] ?? null) : null;
        }

        if (array_key_exists('delivered', $data)) {
            $payload['delivered'] = $data['delivered'];
        }

        if (array_key_exists('customer_name', $data)) {
            $payload['customer_name'] = $data['customer_name'];
        }

        return $payload;
    }

    /**
     * Re-checks stock for this sale's product excluding its own current
     * quantity, and returns the quantity/total columns to save.
     */
    private function quantityUpdatePayload(Sale $sale, int $quantity): array
    {
        $eventProduct = EventProduct::where('id', $sale->event_product_id)
            ->lockForUpdate()
            ->with('product')
            ->firstOrFail();

        $soldElsewhere = $eventProduct->sales()->where('id', '!=', $sale->id)->sum('quantity');
        $available = $eventProduct->quantity_made - $soldElsewhere;

        if ($quantity > $available) {
            throw ValidationException::withMessages([
                'items' => "Solo quedan {$available} unidades de \"{$eventProduct->product->name}\" disponibles.",
            ]);
        }

        return [
            'quantity' => $quantity,
            'total' => $eventProduct->unit_price * $quantity,
        ];
    }
}
