// --- Mocks de Fases y Eventos Específicos para Timeboxes ---

import {
  Planning,
  KickOff,
  Refinement,
  Entrega,
  SolicitudRevision,
  Close,
  QaData,
} from '../../../shared/interfaces/fases-timebox.interface';
import { Timebox } from '../../../shared/interfaces/timebox.interface';
import { MOCK_PERSONAS } from './mock-personas';

const planningActivo: Planning = {
  nombre: 'Planning Inicial V1',
  codigo: 'PLN-001',
  descripcion:
    'Definición del alcance para el desarrollo del módulo de clientes.',
  fechaFase: '',
  eje: 'Expansión de Mercado',
  aplicativo: 'CRM Principal',
  alcance: 'Módulo de Gestión de Clientes',
  esfuerzo: '2 sem',
  fechaInicio: '2025-07-11T04:53:09.033Z',
  teamLeader: {
    nombre: 'José Castro',
  },
  adjuntos: [
    {
      type: 'archivo',
      nombre: 'ActaPlanning.pdf',
      url: '/docs/acta_planning.pdf',
    },
  ],
  skills: [
    { tipo: 'Tecnológica', nombre: 'Angular' },
    { tipo: 'Conceptual', nombre: 'Frontend' },
  ],
  cumplimiento: [
    { label: 'Alcance definido', checked: true },
    { label: 'Equipo asignado', checked: false },
  ],
  completada: true,
};

const kickOffEjecucion: KickOff = {
  fechaFase: '2025-07-12T04:53:09.033Z',
  teamMovilization: {
    businessAdvisor: {
      nombre: '',
    },
    businessAmbassador: {
      nombre: '',
    },
    solutionDeveloper: {
      nombre: '',
    },
    solutionTester: {
      nombre: '',
    },
    technicalAdvisor: {
      nombre: '',
    },
  },
  adjuntos: [
    {
      type: 'archivo',
      nombre: 'PresentacionKickOff.pptx',
      url: '/docs/kickoff_pres.pptx',
    },
  ],
  participantes: MOCK_PERSONAS.slice(0, 3), // Juan, María, Carlos
  listaAcuerdos: [{ label: 'Horario de dailys definido', checked: true }],
  completada: true,
};

const refinementActivo: Refinement = {
  fechaFase: '2025-07-15T04:53:09.033Z',
  revisiones: [
    {
      tipo: 'Revision',
      fechaSolicitud: '2025-07-15T04:53:09.033Z',
      horarioDisponibilidad: {
        Lunes: { bloques: [{ start: '09:00', end: '10:00' }] },
      },
      participantes: MOCK_PERSONAS.slice(0, 2), // Juan, María
      adjuntos: [
        {
          type: 'archivo',
          nombre: 'EspecificacionDetalle.docx',
          url: '/docs/espec_detalle.docx',
        },
      ],
      listaAcuerdos: [{ label: 'Requisito X clarificado', checked: true }],
      completada: false,
    },
  ],

  completada: false,
};

const EntregaEjecucion: Entrega = {
  id: 'del-001',
  fechaEntrega: '2025-07-18T04:53:09.033Z',
  responsable: 'María López',
  adjuntosEntregables: [
    {
      type: 'archivo',
      nombre: 'ModuloClientesV1.zip',
      url: '/entrega/mod_clientes_v1.zip',
    },
  ],
  adjuntosEvidencias: [
    {
      type: 'archivo',
      nombre: 'VideoDemoClientes.mp4',
      url: '/entrega/demo_clientes.mp4',
    },
  ],
  observaciones:
    'Primera versión funcional del módulo de clientes, incluye alta y edición.',
};

const solicitudCierreFinalizado: SolicitudRevision = {
  tipo: 'Cierre',
  fechaSolicitud: '2025-07-18T04:53:09.033Z',
  horarioDisponibilidad: {
    Miércoles: { bloques: [{ start: '14:00', end: '15:00' }] },
  },
  completada: true,
};

const closeFinalizado: Close = {
  fechaFase: '2025-07-19T04:53:09.033Z',
  solicitudCierre: solicitudCierreFinalizado,
  checklist: [
    { label: 'Todas las pruebas pasadas', checked: true },
    { label: 'Documentación actualizada', checked: true },
  ],
  adjuntos: [
    {
      type: 'archivo',
      nombre: 'InformeCierreTimebox.pdf',
      url: '/reports/cierre_timebox.pdf',
    },
  ],
  cumplimiento: 'Total',
  observaciones: 'El Timebox completó el alcance definido satisfactoriamente.',
  aprobador: 'Pedro Soto',
  evMadurezAplicativo:
    'Componente de clientes listo para integración con otros módulos.',
  mejoras: [
    {
      tipo: 'Proceso',
      descripcion: 'Mejorar el proceso de revisión de código.',
    },
  ],
  completada: true,
};

const qaData: QaData = {
  // Estado General
  estadoConsolidacion: 'Completado',
  progresoConsolidacion: 100,

  // Despliegue
  fechaPreparacionEntorno: '2025-07-19T04:53:09.033Z', // Formato YYYY-MM-DD para compatibilidad
  entornoPruebas: 'Pre-producción (QA-SERVER-01)',
  versionDespliegue: '2.1.5-beta',
  responsableDespliegue: 'Juan Pérez (DevOps)',
  observacionesDespliegue:
    'El despliegue se realizó sin incidentes mayores. Se observó un ligero aumento en el tiempo de carga inicial, pero se normalizó después de 5 minutos. Los logs no muestran errores críticos post-despliegue. Se recomienda monitoreo continuo durante las primeras 24 horas.',

  // Testing General
  planPruebasUrl: 'https://ejemplo.com/documentos/plan_pruebas_v2.pdf',
  resultadosPruebas: '280/300 casos de prueba pasados (93% de cobertura).',
  bugsIdentificados: '3 bugs abiertos (1 crítico, 2 menores).',
  urlBugs: 'https://jira.ejemplo.com/browse/PROJ-123',
  responsableQA: 'María González (QA Lead)',

  // UAT
  fechaInicioUAT: '2025-06-21',
  fechaFinUAT: '2025-06-22',
  estadoUAT: 'Aprobado',
  responsableUAT: 'Carlos Rodríguez (Product Owner)',
  feedbackUAT:
    'Los usuarios de negocio validaron la funcionalidad principal y las nuevas características. Se recibieron comentarios positivos sobre la usabilidad, aunque se sugirieron mejoras menores en la interfaz de usuario que se abordarán en futuras iteraciones. El rendimiento fue satisfactorio para los volúmenes de prueba.',

  // Adjuntos
  adjuntosQA: [
    {
      nombre: 'Reporte_Pruebas_Funcionales_V2.pdf',
      url: 'https://ejemplo.com/adjuntos/reporte_funcional_v2.pdf',
      type: 'archivo',
    },
    {
      nombre: 'Acta_Cierre_UAT_Fase_1.docx',
      url: 'https://ejemplo.com/adjuntos/acta_uat_fase1.docx',
      type: 'archivo',
    },
    {
      nombre: 'Dashboard_Performance.png',
      url: 'https://ejemplo.com/adjuntos/dashboard_perf.png',
      type: 'archivo',
    },
  ],
  completada: true, // Añadido el campo 'completada' de tu interfaz
};

export const MOCK_TIMEBOXES: Timebox[] = [
  // 1. Timebox en estado "En Definición"
  {
    id: 'tb-001',
    tipoTimebox: 'tbt-planning', // Planning Timebox
    fases: {
      planning: {
        ...planningActivo,
        nombre: 'Planificación Módulo Reportes',
        descripcion: 'Definición inicial de KPIs y estructura de reportes.',
        fechaInicio: '2025-07-11T04:53:09.033Z',
        completada: false, // Aún en definición
        adjuntos: [],
      },
    },
    estado: 'En Definición',
    publicacionOferta: { publicado: false, solicitado: false },
    monto: 0,
    projectId: 'proj-dashboard-kpi',
  },

  // 2. Timebox en estado "Disponible" (Planning completado, listo para KickOff)
  {
    id: 'tb-002',
    tipoTimebox: 'tbt-Entrega', // Entrega Timebox
    fases: {
      planning: {
        ...planningActivo,
        nombre: 'Planning Módulo Ventas',
        descripcion:
          'Planificación de funcionalidades clave del módulo de ventas.',
        completada: true,
      },
    },
    estado: 'Disponible',
    publicacionOferta: {
      publicado: true,
      fechaPublicacion: '2025-07-11T04:53:09.033Z',
      solicitado: true,
      postulaciones: [
        {
          id: '01',
          rol: 'solutionDeveloper',
          fechaPostulacion: '2025-07-11T04:53:09.033Z',
          desarrollador: 'María López',
          estadoSolicitud: 'pendiente',
          asignacion: {
            asignado: false,
          },
        },
      ],
    },
    monto: 5000,
    projectId: 'proj-dashboard-kpi',
  },

  // 3. Timebox en estado "En Ejecución" (Ya tuvo KickOff y alguna entrega)
  {
    id: 'tb-003',
    tipoTimebox: 'tbt-ux-interaction', // UX & Interaction Timebox
    fases: {
      planning: {
        ...planningActivo,
        nombre: 'Planning Flujo de Usuarios',
        descripcion:
          'Definición de journeys y wireframes para nueva funcionalidad.',
        completada: true,
      },
      kickOff: {
        ...kickOffEjecucion,
        teamMovilization: {
          solutionDeveloper: {
            nombre: 'María López',
          },
        },
        participantes: MOCK_PERSONAS.slice(0, 4), // Juan, María, Carlos, Ana
      },
      refinement: {
        ...refinementActivo,
        fechaFase: '2025-07-15T04:53:09.033Z',
        completada: true, // Un refinement completado
      },
      qa: qaData,
    },
    entrega: {
      ...EntregaEjecucion,
      id: 'del-ux-001',
      responsable: 'María López',
      fechaEntrega: '2025-07-18T04:53:09.033Z',
      adjuntosEntregables: [
        {
          type: 'archivo',
          nombre: 'WireframesV1.pdf',
          url: '/entrega/wireframes_v1.pdf',
        },
      ],
      adjuntosEvidencias: [
        {
          type: 'archivo',
          nombre: 'TestUsabilidadV1.mp4',
          url: '/entrega/test_usab_v1.mp4',
        },
      ],
      observaciones:
        'Primer set de wireframes y resultados de test de usabilidad inicial.',
    },
    estado: 'En Ejecución',
    publicacionOferta: {
      publicado: true,
      fechaPublicacion: '2025-07-11T04:53:09.033Z',
      solicitado: true,
      postulaciones: [
        {
          id: '01',
          rol: 'solutionDeveloper',
          fechaPostulacion: '2025-07-11T04:53:09.033Z',
          desarrollador: 'María López',
          estadoSolicitud: 'aprobada',
          asignacion: {
            asignado: true,
            fechaAsignacion: '2025-07-12T04:53:09.033Z',
          },
        },
      ],
    },
    monto: 0,
    projectId: 'proj-dashboard-kpi',
  },

  // 4. Timebox en estado "Finalizado" (Con todas las fases y un cierre)
  {
    id: 'tb-004',
    tipoTimebox: 'tbt-retrospective', // Retrospective Timebox
    fases: {
      planning: {
        ...planningActivo,
        nombre: 'Planning Retrospectiva Q2',
        descripcion:
          'Preparación de agenda y facilitación de la retrospectiva trimestral.',
        completada: true,
      },
      kickOff: {
        ...kickOffEjecucion,
        teamMovilization: {
          solutionDeveloper: {
            nombre: 'Carlos Ruiz',
          },
        },
        participantes: MOCK_PERSONAS,
        adjuntos: [
          {
            type: 'archivo',
            nombre: 'AgendaRetro.pdf',
            url: '/docs/agenda_retro.pdf',
          },
        ],
      },
      refinement: {
        ...refinementActivo,
        fechaFase: '2025-07-15T04:53:09.033Z',
        completada: true, // Un refinement completado
      },
      qa: qaData,
      close: closeFinalizado,
    },
    entrega: {
      id: 'del-retro-001',
      fechaEntrega: '2025-07-18T04:53:09.033Z',
      responsable: 'Carlos Ruiz',
      adjuntosEntregables: [
        {
          type: 'archivo',
          nombre: 'LeccionesAprendidasQ2.pdf',
          url: '/entrega/lecciones_q2.pdf',
        },
      ],
      adjuntosEvidencias: [
        {
          type: 'archivo',
          nombre: 'AcuerdosEquipo.docx',
          url: '/entrega/acuerdos_equipo.docx',
        },
      ],
      observaciones:
        'Documento de lecciones aprendidas y acuerdos para la mejora continua.',
    },
    estado: 'Finalizado',
    publicacionOferta: {
      publicado: true,
      fechaPublicacion: '2025-07-11T04:53:09.033Z',
      solicitado: true,
      postulaciones: [
        {
          id: '01',
          rol: 'solutionTester',
          fechaPostulacion: '2025-07-11T04:53:09.033Z',
          desarrollador: 'Carlos Ruiz',
          estadoSolicitud: 'aprobada',
          asignacion: {
            asignado: true,
            fechaAsignacion: '2025-07-12T04:53:09.033Z',
          },
        },
      ],
    },
    monto: 0,
    projectId: 'proj-dashboard-kpi',
  },

  // 5. Timebox en estado "En Ejecución" con múltiples refinamientos
  {
    id: 'tb-005',
    tipoTimebox: 'tbt-Entrega', // Entrega Timebox
    fases: {
      planning: {
        ...planningActivo,
        nombre: 'Planning Módulo Pagos',
        descripcion: 'Definición de funcionalidades de procesamiento de pagos.',
        fechaInicio: '2025-07-12T04:53:09.033Z',
        completada: true,
      },
      kickOff: {
        ...kickOffEjecucion,
        teamMovilization: {
          solutionDeveloper: {
            nombre: 'Juan Pérez',
          },
        },
        fechaFase: '2025-07-12T04:53:09.033Z',
        participantes: MOCK_PERSONAS.slice(0, 3), // Juan, María, Carlos
      },
      refinement: {
        ...refinementActivo,
        fechaFase: '2025-07-14T04:53:09.033Z',
        completada: true, // Un refinement completado
      },
      qa: qaData,
    },
    entrega: {
      id: 'del-pagos-001',
      fechaEntrega: '2025-07-16T04:53:09.033Z',
      responsable: 'Juan Pérez',
      adjuntosEntregables: [
        {
          type: 'archivo',
          nombre: 'ProcesadorPagosBasico.zip',
          url: '/entrega/pagos_basico.zip',
        },
      ],
      adjuntosEvidencias: [
        {
          type: 'archivo',
          nombre: 'LogPruebasUnitariasPagos.txt',
          url: '/entrega/log_pruebas_pagos.txt',
        },
      ],
      observaciones: 'Implementación básica de procesamiento de pagos.',
    },
    estado: 'En Ejecución',
    publicacionOferta: {
      publicado: true,
      fechaPublicacion: '2025-07-12T04:53:09.033Z',
      solicitado: true,
      postulaciones: [
        {
          id: '01',
          rol: ' technicalAdvisor',
          fechaPostulacion: '2025-07-12T04:53:09.033Z',
          desarrollador: 'Juan Pérez',
          estadoSolicitud: 'aprobada',
          asignacion: {
            asignado: true,
            fechaAsignacion: '2025-07-12T04:53:09.033Z',
          },
        },
      ],
    },
    monto: 0,
    projectId: 'proj-dashboard-kpi',
  },
  {
    id: 'tb-006',
    tipoTimebox: 'tbt-Entrega', // Entrega Timebox
    fases: {
      planning: {
        ...planningActivo,
        nombre: 'Planning Submódulos de Venta',
        descripcion:
          'Planificación de funcionalidades clave del módulo de ventas.',
        completada: true,
      },
    },
    estado: 'Disponible',
    publicacionOferta: {
      publicado: true,
      fechaPublicacion: '2025-07-11T04:53:09.033Z',
      solicitado: true,
      postulaciones: [
        {
          id: '01',
          rol: 'solutionDeveloper',
          fechaPostulacion: '2025-07-11T04:53:09.033Z',
          desarrollador: 'Karla Jofré',
          estadoSolicitud: 'pendiente',
          asignacion: {
            asignado: false,
          },
        },
      ],
    },
    monto: 5000,
    projectId: 'proj-dashboard-kpi',
  },
  {
    id: 'tb-007',
    tipoTimebox: 'tbt-Entrega', // Entrega Timebox
    fases: {
      planning: {
        ...planningActivo,
        nombre: 'Planning Backend Módulo Ventas',
        descripcion:
          'Planificación de funcionalidades clave del módulo de ventas.',
        completada: true,
      },
    },
    estado: 'Disponible',
    publicacionOferta: {
      publicado: true,
      fechaPublicacion: '2025-07-11T04:53:09.033Z',
      solicitado: true,
      postulaciones: [
        {
          id: '1',
          rol: 'solutionDeveloper',
          fechaPostulacion: '2025-07-11T04:53:09.033Z',
          desarrollador: 'Raúl Vergara',
          estadoSolicitud: 'pendiente',
          asignacion: {
            asignado: false,
          },
        },
      ],
    },
    monto: 5000,
    projectId: 'proj-dashboard-kpi',
  },
];
