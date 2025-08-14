import { Project } from '../../../shared/interfaces/project.interface';
import { MOCK_TIMEBOXES } from './mock-timeboxes';

// --- Mock de Proyectos ---
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-dashboard-kpi',
    nombre: 'Dashboard de KPIs y Métricas',
    descripcion:
      'Proyecto para desarrollar un dashboard interactivo de indicadores clave de rendimiento.',
    fechaCreacion: '2025-06-01',
    contenido: [
      {
        id: 'cont-docs',
        nombre: 'Documentación del Proyecto',
        tipo: 'Carpeta',
        descripcion: 'Todos los documentos relacionados con el proyecto.',
        contenido: [
          {
            id: 'folder-1',
            nombre: 'Documentos Importantes',
            tipo: 'Carpeta',
            descripcion: 'Carpeta para documentos clave',
            contenido: [
              {
                id: 'doc-1',
                nombre: 'Especificaciones V1',
                tipo: 'Documento',
                descripcion: 'Documento de especificaciones iniciales',
                adjunto: {
                  nombre: 'especificaciones_v1.pdf',
                  url: '/mock-files/documento/especificaciones_v1.pdf',

                  fechaAdjunto: '2025-07-18T04:53:09.033Z',
                  type: 'application/pdf',
                },
              },
              {
                id: 'video-1',
                nombre: 'Tutorial de Instalación',
                tipo: 'Video',
                descripcion: 'Video explicativo de la instalación',
                adjunto: {
                  nombre: 'tutorial.mp4',
                  url: '/mock-files/video/tutorial.mp4',

                  fechaAdjunto: '2025-07-18T04:53:09.033Z',
                  type: 'video/mp4',
                },
              },
            ],
          },
          {
            id: 'img-1',
            nombre: 'Logo Beta',
            tipo: 'Imágen',
            descripcion: 'Logo para la fase beta del proyecto',
            adjunto: {
              nombre: 'logo_beta.png',
              url: '/mock-files/imagen/logo_beta.png',

              fechaAdjunto: '2025-07-18T04:53:09.033Z',
              type: 'image/png',
            },
          },
        ],
      },
    ],
    timeboxes: MOCK_TIMEBOXES, // Aquí se vinculan los Timeboxes al proyecto
  },
  {
    id: 'proj-gestion-timeboxes',
    nombre: 'Gestión de Timeboxes',
    descripcion:
      'App web para planificar, gestionar y hacer seguimiento de timeboxes correspondientes a un equipo de trabajo.',
    fechaCreacion: '2025-06-01',
    contenido: [
      {
        id: 'folder-1',
        nombre: 'Documentos Importantes',
        tipo: 'Carpeta',
        descripcion: 'Carpeta para documentos clave',
        contenido: [
          {
            id: 'doc-1',
            nombre: 'Especificaciones V1',
            tipo: 'Documento',
            descripcion: 'Documento de especificaciones iniciales',
            adjunto: {
              nombre: 'especificaciones_v1.pdf',
              url: '/mock-files/documento/especificaciones_v1.pdf',

              fechaAdjunto: '2025-07-18T04:53:09.033Z',
              type: 'application/pdf',
            },
          },
          {
            id: 'video-1',
            nombre: 'Tutorial de Instalación',
            tipo: 'Video',
            descripcion: 'Video explicativo de la instalación',
            adjunto: {
              nombre: 'tutorial.mp4',
              url: '/mock-files/video/tutorial.mp4',

              fechaAdjunto: '2025-07-18T04:53:09.033Z',
              type: 'video/mp4',
            },
          },
        ],
      },
      {
        id: 'img-1',
        nombre: 'Logo Beta',
        tipo: 'Imágen',
        descripcion: 'Logo para la fase beta del proyecto',
        adjunto: {
          nombre: 'logo_beta.png',
          url: '/mock-files/imagen/logo_beta.png',

          fechaAdjunto: '2025-07-18T04:53:09.033Z',
          type: 'image/png',
        },
      },
    ],
    timeboxes: [], // Aquí se vinculan los Timeboxes al proyecto
  },
];
