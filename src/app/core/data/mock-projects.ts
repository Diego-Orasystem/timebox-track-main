import { Product } from '../../shared/interfaces/product.interface';
import { MOCK_TIMEBOXES } from './mock-timeboxes';

//Timeboxes
// export const MOCK_TIMEBOXES: Timebox[] = [
//   {
//     id: 'tbx-001',
//     tipoTimebox: 'Desarrollo',
//     businessAnalyst: {
//       nombre: 'Felipe Araya',
//       email: 'felipe.araya@empresa.cl',
//       rol: 'Business Analyst',
//     },
//     estado: 'En Ejecución',
//     entregableId: 'proj-01',
//     appId: 'app-01',
//     fases: {
//       planning: {
//         fechaCompletado: '2025-06-01',
//         nombre: 'Implementación módulo RRHH',
//         codigo: 'HR-2025-01',
//         descripcion:
//           'Funcionalidad para solicitudes de vacaciones y licencias médicas',
//         eje: 'Gestión Interna',
//         aplicativo: 'RRHH',
//         alcance: 'Web interno',
//         esfuerzo: '30 días persona',
//         fechaInicio: '2025-05-20',
//         teamLeader: {
//           nombre: 'María López',
//           email: 'maria.lopez@empresa.cl',
//           rol: 'Team Leader',
//         },
//         skills: [
//           { tipo: 'Frontend', nombre: 'Angular' },
//           { tipo: 'Backend', nombre: 'Node.js' },
//         ],
//         cumplimiento: [
//           { label: 'Documento funcional aprobado', checked: true },
//           { label: 'Diseño UI validado', checked: true },
//         ],
//         completada: true,
//       },
//       kickOff: {
//         fechaCompletado: '2025-06-03',
//         completada: true,
//         teamMovilization: {
//           businessAmbassador: { nombre: 'Constanza Reyes' },
//           solutionDeveloper: { nombre: 'Javier Alarcón' },
//           solutionTester: { nombre: 'Valentina Muñoz' },
//         },
//         participantes: [
//           { nombre: 'Camilo Rivas', rol: 'Product Owner' },
//           { nombre: 'Sebastián Oliva', rol: 'QA Lead' },
//         ],
//         listaAcuerdos: [
//           { label: 'Reuniones semanales', checked: true },
//           { label: 'Uso de Azure DevOps', checked: true },
//         ],
//       },
//       qa: {
//         fechaCompletado: '2025-07-10',
//         estadoConsolidacion: 'Completado',
//         progresoConsolidacion: 100,
//         fechaPreparacionEntorno: '2025-06-20',
//         entornoPruebas: 'Staging',
//         versionDespliegue: '1.0.0-rc1',
//         responsableDespliegue: 'Laura Pinto',
//         observacionesDespliegue: 'Sin incidencias críticas',
//         planPruebasUrl: 'https://empresa.cl/qa/plan/hr-2025',
//         resultadosPruebas: '160/160 casos de prueba pasados',
//         bugsIdentificados: '0 abiertos',
//         urlBugs: 'https://jira.empresa.cl/hr-2025',
//         responsableQA: 'Sebastián Oliva',
//         fechaInicioUAT: '2025-07-01',
//         fechaFinUAT: '2025-07-05',
//         estadoUAT: 'Aprobado',
//         responsableUAT: 'Cristina Soto',
//         feedbackUAT:
//           'Excelente desempeño, interfaz clara y sin errores funcionales.',
//         completada: true,
//       },
//       close: {
//         fechaCompletado: '2025-07-15',
//         cumplimiento: 'Total',
//         aprobador: 'Marcelo Peña',
//         observaciones: 'Timebox cerrada en plazo y sin incidentes.',
//         checklist: [
//           { label: 'Evidencias cargadas en Sharepoint', checked: true },
//           { label: 'Checklist QA completo', checked: true },
//         ],
//         adjuntosEvidencias: [
//           {
//             type: 'pdf',
//             nombre: 'evidencia_cierre.pdf',
//             url: '/evidencias/hr/evidencia_cierre.pdf',
//             fechaAdjunto: '2025-07-14',
//           },
//         ],
//         mejoras: [
//           {
//             tipo: 'Proceso',
//             descripcion: 'Documentar más temprano los criterios de aceptación',
//           },
//         ],
//         completada: true,
//       },
//     },
//     entrega: {
//       completada: true,
//       fechaEntrega: '2025-07-08',
//       responsable: 'Felipe Araya',
//       observaciones: 'Entregables revisados y aprobados por PO',
//       adjuntosEntregables: [
//         {
//           type: 'docx',
//           nombre: 'manual_usuario.docx',
//           url: '/entregables/manual_usuario.docx',
//           fechaAdjunto: '2025-07-07',
//         },
//       ],
//       solicitudRevision: {
//         tipo: 'Entrega',
//         fechaSolicitud: '2025-07-06',
//         horarioDisponibilidad: {
//           lunes: {
//             bloques: [{ start: '10:00', end: '12:00' }],
//           },
//         },
//         cierreSolicitud: {
//           completada: true,
//           fechaDeRealizacion: '2025-07-07',
//         },
//       },
//     },
//     publicacionOferta: {
//       solicitado: true,
//       publicado: true,
//       fechaPublicacion: '2025-05-15',
//       postulaciones: [
//         {
//           id: 'post-001',
//           rol: 'Frontend Developer',
//           desarrollador: 'Karen Vidal',
//           fechaPostulacion: '2025-05-17',
//           estadoSolicitud: 'Aceptada',
//           asignacion: {
//             asignado: true,
//             fechaAsignacion: '2025-05-18',
//           },
//         },
//         {
//           id: 'post-002',
//           rol: 'QA Tester',
//           desarrollador: 'Esteban Bravo',
//           fechaPostulacion: '2025-05-17',
//           estadoSolicitud: 'Rechazada',
//           asignacion: {
//             asignado: false,
//           },
//         },
//       ],
//     },
//   },
// ];

//Proyectos y apps
export const MOCK_PROJECTS: Product[] = [
  {
    id: 'proj-01',
    nombre: 'Plataforma de Gestión Interna',
    descripcion:
      'Sistema para centralizar la gestión de RRHH, finanzas y operaciones.',
    responsable: {
      nombre: 'Camila Rojas',
      email: 'camila.rojas@empresa.cl',
      rol: 'Jefa de Proyectos',
    },
    fechaCreacion: '2024-01-15',
  },
  {
    id: 'proj-02',
    nombre: 'Sistema de Inventario TI',
    descripcion:
      'Aplicación para llevar el control de activos tecnológicos y licencias.',
    responsable: {
      nombre: 'Cristóbal Núñez',
      email: 'cristobal.nunez@empresa.cl',
      rol: 'Líder Técnico',
    },
    fechaCreacion: '2023-10-01',
  },
  {
    id: 'proj-03',
    nombre: 'Portal de Soporte TI',
    descripcion:
      'Plataforma para recepción de tickets y atención a usuarios internos.',
    responsable: {
      nombre: 'Daniela Salazar',
      email: 'daniela.salazar@empresa.cl',
      rol: 'Product Owner',
    },
    fechaCreacion: '2022-07-20',
  },
];
