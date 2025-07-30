// src/app/shared/services/breadcrumb.service.ts
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  Data,
} from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

// Interfaz para definir una 'miga de pan'
export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private readonly _breadcrumbs = new BehaviorSubject<Breadcrumb[]>([]);
  readonly breadcrumbs$ = this._breadcrumbs.asObservable();

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const root = this.router.routerState.snapshot.root;
        const breadcrumbs = this.getBreadcrumbs(root);
        this._breadcrumbs.next(breadcrumbs);
      });
  }

  private getBreadcrumbs(
    route: ActivatedRouteSnapshot,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children: ActivatedRouteSnapshot[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.url
        .map((segment) => segment.path)
        .join('/');
      if (routeURL !== '') {
        // Evita segmentos vacíos que no contribuyen a la URL
        url += `/${routeURL}`;
      }

      // Obtener el 'label' del breadcrumb
      // Priorizar 'title' de la ruta, luego 'breadcrumb' de la data, si no, el ID
      const label =
        child.data['title'] ||
        child.data['breadcrumb'] ||
        child.paramMap.get('projectId') || // Para la ruta ':projectId'
        child.paramMap.get('folderId') || // Para la ruta ':folderId'
        ''; // Por si acaso no hay nada relevante

      if (label && url) {
        // Solo agrega si hay un label y una URL válida
        // Evitar duplicados si una ruta tiene hijos que también definen su propio breadcrumb
        // Esto es útil para cuando tienes ':projectId' y luego 'timeboxes' o 'folders'
        const existingBreadcrumb = breadcrumbs.find((b) => b.url === url);
        if (!existingBreadcrumb) {
          breadcrumbs.push({
            label: this.capitalizeFirstLetter(label),
            url: url,
          });
        }
      }

      return this.getBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs; // Debería salir por aquí si no hay hijos
  }

  private capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
