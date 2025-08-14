import { Routes } from '@angular/router';
import { TimeboxTableComponent } from './features/timebox/components/timebox-table/timebox-table.component';
import { FolderDetailComponent } from './features/timebox/pages/timebox-planning/folder-detail/folder-detail.component';
import { ProjectDetailComponent } from './features/timebox/pages/timebox-planning/project-detail/project-detail.component';
import { ProjectTimeboxesPageComponent } from './features/timebox/pages/timebox-planning/project-timeboxes/project-timeboxes.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './features/timebox/pages/timebox-planning/project-list/project-list.component'
      ).then((m) => m.ProjectListComponent),
    data: { breadcrumb: 'Proyectos' },
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/general/pages/inicio/inicio.component').then(
        (m) => m.InicioComponent
      ),
  },
  {
    path: 'home/:nombreProyecto',
    loadComponent: () =>
      import(
        './features/general/pages/detalle-proyecto/detalle-proyecto.component'
      ).then((m) => m.DetalleProyectoComponent),
  },

  {
    path: 'timebox-maintainer',
    loadComponent: () =>
      import(
        './features/timebox/pages/timebox-maintainer/timebox-maintainer.component'
      ).then((m) => m.TimeboxMaintainerComponent),
  },
  {
    path: 'task-inbox',
    loadComponent: () =>
      import('./features/task-inbox/pages/inbox/inbox.component').then(
        (m) => m.InboxComponent
      ),
  },
  {
    path: 'timebox-requests',
    loadComponent: () =>
      import(
        './features/timebox/pages/timebox-request/timebox-request.component'
      ).then((m) => m.TimeboxRequestsComponent),
  },
  {
    path: 'projects/:projectId', // Nivel 2: Contenido de un proyecto (subcarpetas y 'timeboxes' por defecto)
    component: ProjectDetailComponent, // Nuevo componente para el detalle de un proyecto
    data: { breadcrumb: 'Detalle de Proyecto' },
    children: [
      {
        path: '', // Muestra el contenido por defecto del proyecto (subcarpetas y la carpeta 'timeboxes')
        redirectTo: 'folders', // Puedes elegir redireccionar a la vista de carpetas por defecto
        pathMatch: 'full',
        data: { breadcrumb: 'Carpetas' },
      },
      {
        path: 'folders', // Nivel 2.1: Lista de subcarpetas dentro del proyecto
        component: FolderDetailComponent, // Componente para listar subcarpetas
        title: 'Carpetas del Proyecto',
        data: { breadcrumb: 'Carpetas' },
      },
      {
        path: 'timeboxes', // Nivel 2.2: La carpeta por defecto de timeboxes dentro del proyecto
        // Carga el nuevo componente CONTENEDOR
        component: ProjectTimeboxesPageComponent,
        title: 'Timeboxes del Proyecto',
        data: { breadcrumb: 'Timeboxes' },
      },
      {
        path: 'folders/:folderId', // Nivel 3: Contenido de una subcarpeta (aquí se crearían timeboxes u otro contenido)
        component: FolderDetailComponent, // El mismo componente FolderDetailComponent pero con otro contexto
        title: 'Contenido de Carpeta',
        data: { breadcrumb: 'Contenido' },
      },
      // Puedes añadir más rutas para otros tipos de contenido dentro de subcarpetas si es necesario
    ],
  },
{
    path: 'mis-pagos',
    loadComponent: () =>
      import('./features/finanzas/pages/mis-pagos/mis-pagos.component').then(
        (m) => m.MisPagosComponent
      ),
  },
  {
    path: 'ordenes-pago',
    loadComponent: () =>
      import(
        './features/finanzas/pages/orden-de-pago/orden-de-pago.component'
      ).then((m) => m.OrdenDePagoComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
