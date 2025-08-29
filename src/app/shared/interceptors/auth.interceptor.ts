import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtener el token actual
  const token = authService.getAccessToken();
  
  // Si hay token, agregarlo al header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Continuar con la petición
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el token expiró o es inválido
      if (error.status === 401) {
        console.log('🔐 Token expirado o inválido, redirigiendo al login');
        // Usar el método público logout que limpia los datos
        authService.logout().subscribe();
      }
      
      return throwError(() => error);
    })
  );
};
