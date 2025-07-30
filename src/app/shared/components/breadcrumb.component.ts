// src/app/shared/components/breadcrumb/breadcrumb.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Necesario para [routerLink]

import { Observable } from 'rxjs';
import { Breadcrumb, BreadcrumbService } from './breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="flex py-3 text-gray-700 " aria-label="Breadcrumb">
      <ol
        class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse"
      >
        <li class="inline-flex items-center">
          <a
            routerLink="/"
            class="inline-flex items-center text-xs font-medium text-gray-700 hover:text-[var(--primary)] dark:text-gray-400 "
          >
            Dashboard
          </a>
        </li>
        <li *ngFor="let breadcrumb of breadcrumbs$ | async; let last = last">
          <div class="flex items-center">
            <svg
              class="rtl:rotate-180 block w-3 h-3 mx-1 text-gray-400 "
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m1 9 4-4-4-4"
              />
            </svg>
            <a
              *ngIf="!last"
              [routerLink]="breadcrumb.url"
              class="ms-1 text-xs font-medium text-gray-700 hover:text-[var(--primary)] md:ms-2 dark:text-gray-400 "
            >
              {{ breadcrumb.label }}
            </a>
            <span
              *ngIf="last"
              class="ms-1 text-xs font-medium text-gray-500 md:ms-2 dark:text-gray-400"
            >
              {{ breadcrumb.label }}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  breadcrumbs$: Observable<Breadcrumb[]>;

  constructor(private breadcrumbService: BreadcrumbService) {
    this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$;
  }
}
