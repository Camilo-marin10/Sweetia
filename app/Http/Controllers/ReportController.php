<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $from = isset($data['from']) ? Carbon::parse($data['from'])->startOfDay() : Carbon::now()->startOfMonth();
        $to = isset($data['to']) ? Carbon::parse($data['to'])->endOfDay() : Carbon::now()->endOfMonth();

        // Guard against an inverted or absurdly large range from a mistyped custom date.
        if ($to->lt($from)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $eventIds = Event::whereBetween('event_date', [$from->toDateString(), $to->toDateString()])->pluck('id');

        $income = DB::table('sales')
            ->whereIn('event_id', $eventIds)
            ->sum('amount_paid');

        $salesTotal = DB::table('sales')
            ->whereIn('event_id', $eventIds)
            ->sum('total');

        $pending = $salesTotal - $income;

        $expenses = DB::table('expenses')
            ->whereIn('event_id', $eventIds)
            ->sum('amount');

        $quantitySold = DB::table('sales')
            ->whereIn('event_id', $eventIds)
            ->sum('quantity');

        $incomeByMonth = DB::table('sales')
            ->join('events', 'events.id', '=', 'sales.event_id')
            ->whereIn('sales.event_id', $eventIds)
            ->selectRaw("DATE_FORMAT(events.event_date, '%Y-%m') as month, SUM(sales.amount_paid) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        $expensesByMonth = DB::table('expenses')
            ->join('events', 'events.id', '=', 'expenses.event_id')
            ->whereIn('expenses.event_id', $eventIds)
            ->selectRaw("DATE_FORMAT(events.event_date, '%Y-%m') as month, SUM(expenses.amount) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        $expensesByProduct = DB::table('expenses')
            ->leftJoin('event_products', 'event_products.id', '=', 'expenses.event_product_id')
            ->leftJoin('products', 'products.id', '=', 'event_products.product_id')
            ->whereIn('expenses.event_id', $eventIds)
            ->selectRaw('products.id as product_id, COALESCE(products.name, ?) as product_name, SUM(expenses.amount) as total', ['General'])
            ->groupBy('products.id', 'product_name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'product_name' => $row->product_name,
                'total' => (float) $row->total,
            ]);

        $quantityByMonth = DB::table('sales')
            ->join('events', 'events.id', '=', 'sales.event_id')
            ->whereIn('sales.event_id', $eventIds)
            ->selectRaw("DATE_FORMAT(events.event_date, '%Y-%m') as month, SUM(sales.quantity) as qty")
            ->groupBy('month')
            ->pluck('qty', 'month');

        $months = [];
        $cursor = $from->copy()->startOfMonth();
        $end = $to->copy()->startOfMonth();
        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m');
            $monthIncome = (float) ($incomeByMonth[$key] ?? 0);
            $monthExpenses = (float) ($expensesByMonth[$key] ?? 0);

            $months[] = [
                'month' => $key,
                'label' => ucfirst($cursor->translatedFormat('M Y')),
                'income' => $monthIncome,
                'expenses' => $monthExpenses,
                'profit' => $monthIncome - $monthExpenses,
                'quantity' => (int) ($quantityByMonth[$key] ?? 0),
            ];

            $cursor->addMonth();
        }

        $events = Event::whereIn('id', $eventIds)
            ->withSum('sales as paid_total', 'amount_paid')
            ->withSum('expenses', 'amount')
            ->orderByDesc('event_date')
            ->get()
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'name' => $event->name,
                'event_date' => $event->event_date->toDateString(),
                'status' => $event->status,
                'income' => (float) ($event->paid_total ?? 0),
                'expenses' => (float) ($event->expenses_sum_amount ?? 0),
                'profit' => (float) ($event->paid_total ?? 0) - (float) ($event->expenses_sum_amount ?? 0),
            ]);

        return Inertia::render('Reports/Index', [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'summary' => [
                'income' => (float) $income,
                'pending' => (float) $pending,
                'expenses' => (float) $expenses,
                'profit' => (float) $income - (float) $expenses,
                'quantitySold' => (int) $quantitySold,
            ],
            'months' => $months,
            'events' => $events,
            'expensesByProduct' => $expensesByProduct,
        ]);
    }
}
