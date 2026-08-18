<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(): Response
    {
        $events = Event::withSum(['sales as paid_total' => fn ($query) => $query->where('paid', true)], 'total')
            ->withSum(['sales as pending_total' => fn ($query) => $query->where('paid', false)], 'total')
            ->withSum('expenses', 'amount')
            ->orderByDesc('event_date')
            ->get()
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'name' => $event->name,
                'event_date' => $event->event_date->toDateString(),
                'status' => $event->status,
                'income' => (float) ($event->paid_total ?? 0),
                'pending' => (float) ($event->pending_total ?? 0),
                'expenses' => (float) ($event->expenses_sum_amount ?? 0),
                'profit' => (float) ($event->paid_total ?? 0) - (float) ($event->expenses_sum_amount ?? 0),
            ]);

        return Inertia::render('Events/Index', [
            'events' => $events,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $event = Event::create([
            ...$data,
            'status' => 'planificado',
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('events.show', $event)->with('success', 'Evento creado.');
    }

    public function show(Event $event): Response
    {
        $event->load([
            'eventProducts' => fn ($query) => $query->withSum('sales', 'quantity')->with('product'),
            'sales' => fn ($query) => $query->latest()->with(['eventProduct.product', 'seller']),
            'expenses' => fn ($query) => $query->latest()->with('registeredByUser'),
        ]);

        $income = $event->sales->where('paid', true)->sum('total');
        $pending = $event->sales->where('paid', false)->sum('total');
        $expenseTotal = $event->expenses->sum('amount');
        $totalUnitsMade = $event->eventProducts->sum('quantity_made');
        $avgCostPerUnit = $totalUnitsMade > 0 ? $expenseTotal / $totalUnitsMade : 0;

        return Inertia::render('Events/Show', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'event_date' => $event->event_date->toDateString(),
                'status' => $event->status,
                'notes' => $event->notes,
            ],
            'eventProducts' => $event->eventProducts->map(fn ($eventProduct) => [
                'id' => $eventProduct->id,
                'product' => $eventProduct->product,
                'quantity_made' => $eventProduct->quantity_made,
                'quantity_sold' => $eventProduct->quantity_sold,
                'quantity_available' => $eventProduct->quantity_available,
                'unit_price' => (float) $eventProduct->unit_price,
                'cost_per_unit' => (float) $avgCostPerUnit,
                'profit_per_unit' => (float) $eventProduct->unit_price - (float) $avgCostPerUnit,
            ]),
            'sales' => $event->sales->map(fn ($sale) => [
                'id' => $sale->id,
                'customer_name' => $sale->customer_name,
                'product_name' => $sale->eventProduct->product->name,
                'quantity' => $sale->quantity,
                'unit_price' => (float) $sale->unit_price,
                'total' => (float) $sale->total,
                'payment_method' => $sale->payment_method,
                'paid' => $sale->paid,
                'sold_by' => $sale->seller->name,
                'created_at' => $sale->created_at->toDateTimeString(),
            ]),
            'expenses' => $event->expenses->map(fn ($expense) => [
                'id' => $expense->id,
                'category' => $expense->category,
                'description' => $expense->description,
                'amount' => (float) $expense->amount,
                'expense_date' => $expense->expense_date->toDateString(),
                'registered_by' => $expense->registeredByUser->name,
            ]),
            'summary' => [
                'income' => (float) $income,
                'pending' => (float) $pending,
                'expenses' => (float) $expenseTotal,
                'profit' => (float) $income - (float) $expenseTotal,
            ],
            'availableProducts' => Product::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'status' => ['required', 'in:planificado,activo,cerrado'],
            'notes' => ['nullable', 'string'],
        ]);

        $event->update($data);

        return back()->with('success', 'Evento actualizado.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        $event->delete();

        return redirect()->route('events.index')->with('success', 'Evento eliminado.');
    }
}
