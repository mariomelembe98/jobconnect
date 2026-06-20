<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Auth/Login'));

Route::get('/login', fn () => Inertia::render('Auth/Login'))->name('login');
Route::get('/register', fn () => Inertia::render('Auth/Register'))->name('register');
Route::get('/client', fn () => Inertia::render('Client/Dashboard'))->name('client.dashboard');
Route::get('/professional', fn () => Inertia::render('Professional/Dashboard'))->name('professional.dashboard');
Route::get('/admin', fn () => Inertia::render('Admin/Dashboard'))->name('admin.dashboard');
