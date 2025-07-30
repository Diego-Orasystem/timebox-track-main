import {
  TimeboxCategory,
  TimeboxType,
} from '../../../shared/interfaces/timebox.interface';

export const MOCK_TIMEBOX_CATEGORIES: TimeboxCategory[] = [
  { id: 'cat-desarrollo', nombre: 'I. Ciclos de desarrollo del producto' },
  {
    id: 'cat-soporte',
    nombre: 'II. Soporte estratégico y gestión de desempeño',
  },
  { id: 'cat-calidad', nombre: 'III. Calidad, pruebas y estabilización' },
  { id: 'cat-cambio', nombre: 'IV. Gestión del cambio y entrega final' },
  { id: 'cat-mejora', nombre: 'V. Mejora continua del equipo' },
];

export const MOCK_TIMEBOX_TYPES: TimeboxType[] = [
  // Categoría: I. Ciclos de desarrollo del producto
  {
    id: 'tbt-Entrega',
    nombre: 'Entrega Timebox',
    definicion: 'Desarrollar incrementos funcionales del producto.',
    categoriaId: 'cat-desarrollo',
    entregablesComunes: [
      'Funcionalidades completas',
      'Código fuente versionado',
      'Componentes integrados',
    ],
    evidenciasCierre: [
      'Captura de pantalla',
      'Video demo',
      'Evidencia de pruebas internas',
      'Pull Request Cerrado',
    ],
  },
  {
    id: 'tbt-specialized-algo',
    nombre: 'Specialized Algorithm Timebox',
    definicion:
      'Desarrollar o ajustar algoritmos complejos con alto impacto técnico o de negocio.',
    categoriaId: 'cat-desarrollo',
    evidenciasCierre: [
      'Resultados de prueba comparativa',
      'Notebook validado',
      'Revisión técnica aprobada',
    ],
    entregablesComunes: [
      'Modelo Entrenado',
      'Lógica de cálculo optimizada',
      'Benchmark documentado',
    ],
  },
  {
    id: 'tbt-ux-interaction',
    nombre: 'UX & Interaction Timebox',
    definicion: 'Diseñar o mejorar interfaces e interacciones de usuario.',
    categoriaId: 'cat-desarrollo',
    entregablesComunes: [
      'Mockups',
      'Wireframes',
      'Prototipos navegables',
      'Guías de estilo',
    ],
    evidenciasCierre: [
      'Feedback de usuarios',
      'Grabación de test de usabilidad',
      'Revisión de UI por stakeholders',
    ],
  },
  {
    id: 'tbt-data-integration',
    nombre: 'Data Integration Timebox',
    definicion:
      'Integrar sistemas mediante procesos ETL y asegurar consistencia de datos.',
    categoriaId: 'cat-desarrollo',
    entregablesComunes: [
      'ETL scripts',
      'Esquemas de datos',
      'Tablas de staging/documentadas',
    ],
    evidenciasCierre: [
      'Log de ejecución exitoso',
      'Pruebas de integridad de datos',
      'Validación con origen/destino',
    ],
  },

  // Categoría: II. Soporte estratégico y gestión de desempeño
  {
    id: 'tbt-planning',
    nombre: 'Planning Timebox',
    definicion:
      'Definir el alcance, esfuerzo, riesgos y secuencia del trabajo.',
    categoriaId: 'cat-soporte',
    entregablesComunes: [
      'timebox backlog',
      'Matriz de riesgos',
      'Definición de entregables priorizados',
    ],
    evidenciasCierre: [
      'Acta de planificación',
      'Aprobación del equipo',
      'Resumen en herramienta de gestión',
    ],
  },
  {
    id: 'tbt-performance-metrics',
    nombre: 'Performance Metrics Timebox',
    definicion:
      'Diseñar indicadores de desempeño alineados a los objetivos del proyecto.',
    categoriaId: 'cat-soporte',
    entregablesComunes: [
      'Catálogo de KPIs',
      'Fórmulas de cálculo',
      'Definiciones de indicadores',
    ],
    evidenciasCierre: [
      'Simulación de resultados',
      'Revisión con área de control de gestión',
    ],
  },
  {
    id: 'tbt-dashboard-construction',
    nombre: 'Dashboard Construction Timebox',
    definicion:
      'Construir dashboards para seguimiento y visualización de indicadores.',
    categoriaId: 'cat-soporte',
    entregablesComunes: [
      'Dashboard funcional',
      'Conexión a fuentes de datos',
      'Filtros configurados',
    ],
    evidenciasCierre: [
      'Capturas del dashboard',
      'Revisión funcional',
      'Validación con usuarios',
    ],
  },
  {
    id: 'tbt-exploration',
    nombre: 'Exploration Timebox',
    definicion: 'Investigar tecnologías, enfoques o requerimientos complejos.',
    categoriaId: 'cat-soporte',
    entregablesComunes: [
      'Informe técnico',
      'Prototipo exploratorio',
      'Análisis de viabilidad',
    ],
    evidenciasCierre: [
      'Revisión con expertos',
      'Decisión registrada para próximos pasos',
    ],
  },

  // Categoría: III. Calidad, pruebas y estabilización
  {
    id: 'tbt-global-testing',
    nombre: 'Global Testing Timebox',
    definicion:
      'Realizar pruebas integradas y de aceptación sobre la solución completa.',
    categoriaId: 'cat-calidad',
    entregablesComunes: [
      'Plan de pruebas',
      'Ejecución de pruebas UAT',
      'Reporte de incidencias',
    ],
    evidenciasCierre: [
      'Firmas o aprobaciones',
      'Evidencia de pruebas exitosas',
      'Log de resultados',
    ],
  },
  {
    id: 'tbt-stabilization',
    nombre: 'Stabilization Timebox',
    definicion:
      'Refactorizar, resolver deuda técnica y estabilizar componentes.',
    categoriaId: 'cat-calidad',
    entregablesComunes: [
      'Código refactorizado',
      'Mejoras aplicadas',
      'Mejoras de performance',
    ],
    evidenciasCierre: [
      'Comparativa de performance',
      'CI/CD exitoso',
      'Revisión por QA',
    ],
  },

  // Categoría: IV. Gestión del cambio y entrega final
  {
    id: 'tbt-deployment-preparation',
    nombre: 'Deployment Preparation Timebox',
    definicion:
      'Preparar documentación, scripts e infraestructura para el despliegue.',
    categoriaId: 'cat-cambio',
    entregablesComunes: [
      'Scripts de despliegue',
      'Documentación de paso a producción',
      'Plan de respaldo',
    ],
    evidenciasCierre: [
      'Checklist completado',
      'Validación de infraestructura',
      'Plan aprobado',
    ],
  },
  {
    id: 'tbt-release',
    nombre: 'Release Timebox',
    definicion:
      'Liberar una versión funcional para producción o validación del cliente.',
    categoriaId: 'cat-cambio',
    entregablesComunes: [
      'Build versionada',
      'Release notes',
      'Entregables funcionales',
    ],
    evidenciasCierre: [
      'Evidencia de instalación',
      'Revisión con cliente',
      'Validación post-entrega',
    ],
  },

  // Categoría: V. Mejora continua del equipo
  {
    id: 'tbt-retrospective',
    nombre: 'Retrospective Timebox',
    definicion:
      'Revisar procesos, identificar mejoras y establecer acciones de ajuste.',
    categoriaId: 'cat-mejora',
    entregablesComunes: [
      'Lecciones aprendidas',
      'Plan de mejora continua',
      'Acuerdos de equipo',
    ],
    evidenciasCierre: [
      'Acta de retrospectiva',
      'Tareas de mejora asignadas',
      'Consenso documentado',
    ],
  },
];

export const GLOBAL_DELIVERABLES: string[] = [
  'Funcionalidades completas',
  'Código fuente versionado',
  'Componentes integrados',
  'Mockups',
  'Wireframes',
  'Prototipos navegables',
  'Guías de estilo',
  'ETL scripts',
  'Esquemas de datos',
  'Tablas de staging/documentadas',
  'Timebox backlog',
  'Matriz de riesgos',
  'Definición de entregables priorizados',
  'Catálogo de KPIs',
  'Fórmulas de cálculo',
  'Definiciones de indicadores',
  'Dashboard funcional',
  'Conexión a fuentes de datos',
  'Filtros configurados',
  'Informe técnico',
  'Prototipo exploratorio',
  'Análisis de viabilidad',
  'Plan de pruebas',
  'Ejecución de pruebas UAT',
  'Reporte de incidencias',
  'Código refactorizado',
  'Mejoras aplicadas',
  'Mejoras de performance',
  'Scripts de despliegue',
  'Documentación de paso a producción',
  'Plan de respaldo',
  'Build versionada',
  'Release notes',
  'Entregables funcionales',
  'Lecciones aprendidas',
  'Plan de mejora continua',
  'Acuerdos de equipo',
  'Modelo Entrenado',
  'Lógica de cálculo optimizada',
  'Benchmark documentado',
];

export const GLOBAL_EVIDENCES: string[] = [
  'Captura de pantalla',
  'Video demo',
  'Evidencia de pruebas internas',
  'Pull Request Cerrado',
  'Resultados de prueba comparativa',
  'Notebook validado',
  'Revisión técnica aprobada',
  'Log de ejecución exitoso',
  'Pruebas de integridad de datos',
  'Validación con origen/destino',
  'Acta de planificación',
  'Aprobación del equipo',
  'Resumen en herramienta de gestión',
  'Simulación de resultados',
  'Revisión con área de control de gestión',
  'Capturas del dashboard',
  'Revisión funcional',
  'Validación con usuarios',
  'Revisión con expertos',
  'Decisión registrada para próximos pasos',
  'Firmas o aprobaciones',
  'Evidencia de pruebas exitosas',
  'Log de resultados',
  'Comparativa de performance',
  'CI/CD exitoso',
  'Revisión por QA',
  'Checklist completado',
  'Validación de infraestructura',
  'Plan aprobado',
  'Evidencia de instalación',
  'Revisión con cliente',
  'Validación post-entrega',
  'Acta de retrospectiva',
  'Tareas de mejora asignadas',
  'Consenso documentado',
  'Feedback de usuarios',
  'Grabación de test de usabilidad',
  'Revisión de UI por stakeholders',
];
