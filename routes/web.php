<?php

use App\Http\Controllers\EventController;
use App\Http\Controllers\EventProductController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('events.index');
});

Route::redirect('/dashboard', '/events')->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::middleware('admin')->group(function () {
        Route::resource('products', ProductController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');

    Route::resource('events', EventController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::post('events/{event}/products', [EventProductController::class, 'store'])->name('event-products.store');
    Route::put('event-products/{eventProduct}', [EventProductController::class, 'update'])->name('event-products.update');
    Route::delete('event-products/{eventProduct}', [EventProductController::class, 'destroy'])->name('event-products.destroy');

    Route::post('events/{event}/sales', [SaleController::class, 'store'])->name('sales.store');
    Route::put('sales/group/{groupId}', [SaleController::class, 'updateGroup'])->name('sales.group.update');
    Route::delete('sales/group/{groupId}', [SaleController::class, 'destroyGroup'])->name('sales.group.destroy');
    Route::put('sales/{sale}', [SaleController::class, 'update'])->name('sales.update');
    Route::delete('sales/{sale}', [SaleController::class, 'destroy'])->name('sales.destroy');

    Route::post('events/{event}/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::put('expenses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');
});

require __DIR__.'/auth.php';
