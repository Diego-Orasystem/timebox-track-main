import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth.service';
import { StorageService } from '../../../../shared/services/storage.service';
import { LoginRequest } from '../../../../shared/interfaces/auth.interface';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Logo y Título -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4">
            <svg class="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-white mb-2">Timebox Track</h2>
          <p class="text-blue-100">Inicia sesión en tu cuenta</p>
        </div>

        <!-- Formulario de Login -->
        <div class="bg-white rounded-lg shadow-xl p-8">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Username/Email -->
            <div>
              <label for="identifier" class="block text-sm font-medium text-gray-700 mb-2">
                Usuario o Email
              </label>
              <input
                id="identifier"
                type="text"
                formControlName="identifier"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa tu usuario o email"
                [class.border-red-500]="isFieldInvalid('identifier')"
              />
              <div *ngIf="isFieldInvalid('identifier')" class="mt-1 text-sm text-red-600">
                <span *ngIf="loginForm.get('identifier')?.errors?.['required']">
                  Usuario o email es requerido
                </span>
                <span *ngIf="loginForm.get('identifier')?.errors?.['minlength']">
                  Debe tener al menos 3 caracteres
                </span>
              </div>
            </div>

            <!-- Contraseña -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div class="relative">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  id="password"
                  formControlName="password"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa tu contraseña"
                  [class.border-red-500]="isFieldInvalid('password')"
                />
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg *ngIf="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <svg *ngIf="showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                  </svg>
                </button>
              </div>
              <div *ngIf="isFieldInvalid('password')" class="mt-1 text-sm text-red-600">
                <span *ngIf="loginForm.get('password')?.errors?.['required']">
                  Contraseña es requerida
                </span>
                <span *ngIf="loginForm.get('password')?.errors?.['minlength']">
                  Debe tener al menos 6 caracteres
                </span>
              </div>
            </div>

            <!-- Opciones adicionales -->
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  formControlName="rememberMe"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                  Recordarme
                </label>
              </div>
              <button
                type="button"
                (click)="forgotPassword()"
                class="text-sm text-blue-600 hover:text-blue-500"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <!-- Botón de Login -->
            <button
              type="submit"
              [disabled]="isLoading || loginForm.invalid"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                *ngIf="isLoading"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            </button>

            <!-- Mensaje de Error -->
            <div *ngIf="errorMessage" class="text-center">
              <p class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {{ errorMessage }}
              </p>
            </div>

            <!-- Información de Demo -->
            <div class="text-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
              <p>Demo: admin / admin123</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      identifier: this.loginForm.value.identifier,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        if (response.success) {
          // Guardar preferencia de "recordarme" si está marcada
          if (this.loginForm.value.rememberMe) {
            this.storageService.setItem('rememberMe', 'true');
          }
          
          // Redirigir al home
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al iniciar sesión';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  forgotPassword(): void {
    // TODO: Implementar navegación a página de recuperación de contraseña
    console.log('Navegar a recuperación de contraseña');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }
}
