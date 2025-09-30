import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { LoginGuard } from './shared/guards/login.guard';
import { TimeboxTableComponent } from './features/timebox/components/timebox-table/timebox-table.component';
import { FolderDetailComponent } from './features/timebox/pages/timebox-planning/folder-detail/folder-detail.component';
import { ProjectDetailComponent } from './features/timebox/pages/timebox-planning/project-detail/project-detail.component';
import { ProjectTimeboxesPageComponent } from './features/timebox/pages/timebox-planning/project-timeboxes/project-timeboxes.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { InicioComponent } from './features/general/pages/inicio/inicio.component';
import { TimeboxMaintainerComponent } from './features/timebox/pages/timebox-maintainer/timebox-maintainer.component';
import { InboxComponent } from './features/task-inbox/pages/inbox/inbox.component';
import { MisPagosComponent } from './features/finanzas/pages/mis-pagos/mis-pagos.component';
import { OrdenDePagoComponent } from './features/finanzas/pages/orden-de-pago/orden-de-pago.component';

export const routes: Routes = [
  // Ruta de login - solo accesible si NO está autenticado
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [LoginGuard]
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [LoginGuard]
  },

  // Ruta raíz - redirige a home si está autenticado
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // Rutas protegidas - solo accesibles si está autenticado
  {
    path: 'home',
    loadComponent: () =>
      import('./features/general/pages/inicio/inicio.component').then(
        (m) => m.InicioComponent
      ),
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Inicio' }
  },

  {
    path: 'home/:nombreProyecto',
    loadComponent: () =>
      import(
        './features/general/pages/detalle-proyecto/detalle-proyecto.component'
      ).then((m) => m.DetalleProyectoComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'timebox-planning',
    loadComponent: () =>
      import(
        './features/timebox/pages/timebox-planning/project-list/project-list.component'
      ).then((m) => m.ProjectListComponent),
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Timebox Planning' }
  },

  {
    path: 'timebox-maintainer',
    loadComponent: () =>
      import(
        './features/timebox/pages/timebox-maintainer/timebox-maintainer.component'
      ).then((m) => m.TimeboxMaintainerComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'timebox-frappe-gantt',
    loadComponent: () =>
      import(
        './features/timebox/pages/timebox-frappe-gantt/timebox-frappe-gantt.component'
      ).then((m) => m.TimeboxFrappeGanttComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'task-inbox',
    loadComponent: () =>
      import('./features/task-inbox/pages/inbox/inbox.component').then(
        (m) => m.InboxComponent
      ),
    canActivate: [AuthGuard]
  },

  {
    path: 'timebox-requests',
    loadComponent: () =>
      import(
        './features/timebox/pages/timebox-request/timebox-request.component'
      ).then((m) => m.TimeboxRequestsComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'projects/:projectId',
    component: ProjectDetailComponent,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Detalle de Proyecto' },
    children: [
      {
        path: '',
        redirectTo: 'folders',
        pathMatch: 'full',
        data: { breadcrumb: 'Carpetas' },
      },
      {
        path: 'folders',
        component: FolderDetailComponent,
        title: 'Carpetas del Proyecto',
        data: { breadcrumb: 'Carpetas' },
      },
      {
        path: 'timeboxes',
        component: ProjectTimeboxesPageComponent,
        title: 'Timeboxes del Proyecto',
        data: { breadcrumb: 'Timeboxes' },
      },
      {
        path: 'folders/:folderId',
        component: FolderDetailComponent,
        title: 'Contenido de Carpeta',
        data: { breadcrumb: 'Contenido' },
      },
    ],
  },

  {
    path: 'mis-pagos',
    loadComponent: () =>
      import('./features/finanzas/pages/mis-pagos/mis-pagos.component').then(
        (m) => m.MisPagosComponent
      ),
    canActivate: [AuthGuard]
  },

  {
    path: 'ordenes-pago',
    loadComponent: () =>
      import('./features/finanzas/pages/orden-de-pago/orden-de-pago.component').then(
        (m) => m.OrdenDePagoComponent
      ),
    canActivate: [AuthGuard]
  },

  // Ruta del gestor de roles (solo para usuarios con permisos de gestión de roles)
  {
    path: 'gestor-roles',
    loadComponent: () =>
      import('./features/finanzas/pages/gestor-roles/gestor-roles.component').then(
        (m) => m.GestorRolesComponent
      ),
    canActivate: [AuthGuard]
  },

  // Ruta de gestión de usuarios (solo para administradores)
  {
    path: 'admin/users',
    loadComponent: () =>
      import('./features/admin/components/user-management/user-management.component').then(
        (m) => m.UserManagementComponent
      ),
    canActivate: [AuthGuard]
  },

  // Ruta catch-all - redirige a login si no está autenticado, a home si está autenticado
  {
    path: '**',
    redirectTo: 'home'
  },
];
