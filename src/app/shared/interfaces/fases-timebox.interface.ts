export interface Planning {
  fechaCompletado: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  fechaFase: string;
  eje: string;
  aplicativo: string;
  alcance: string;
  esfuerzo: string;
  fechaInicio: string;
  teamLeader?: Persona;
  adjuntos?: Adjuntos[];
  skills: Skill[];
  cumplimiento?: Checklist[];
  completada: boolean;
  // Campos adicionales del backend
  fecha_inicio?: string;
  team_leader_nombre?: string;
  team_leader_id?: string;
  team_leader_json?: string | any;
  entregableId?: string;
}

export interface KickOff {
  fechaCompletado: string;
  teamMovilization: TeamMovilization;
  adjuntos?: Adjuntos[];
  participantes?: Persona[];
  listaAcuerdos?: Checklist[];
  completada: boolean;
}

export interface Refinement {
  revisiones?: SolicitudRevision[];
  completada?: boolean;
  fechaCompletado?: string;
}

export interface QaData {
  fechaCompletado?: string;
  estadoConsolidacion?: string; // 'Pendiente', 'En Progreso', 'Completado', 'Bloqueado'

  // Despliegue
  fechaPreparacionEntorno?: string; // O Date
  entornoPruebas?: string; // Ej. 'Staging'
  versionDespliegue?: string; // Ej. '1.0.0-rc1'
  responsableDespliegue?: string;
  observacionesDespliegue?: string; // Para párrafos largos

  // Testing General

  resultadosPruebas?: string; // Ej. '150/160 casos de prueba pasados'
  bugsIdentificados?: string; // Ej. '5 abiertos, 2 críticos'
  responsableQA?: string;

  // Adjuntos
  adjuntosQA?: Adjuntos[]; // Reutiliza tu interfaz Adjunto: { nombre: string, url: string, type?: string }
  completada: boolean;
}

export interface Entrega {
  id?: string;
  fechaEntrega?: string;
  responsable?: string;
  adjuntosEntregables?: Adjuntos[];
  solicitudRevision?: SolicitudRevision;
  observaciones?: string;
  completada: boolean;
}

export interface Close {
  fechaCompletado: string;
  solicitudCierre?: SolicitudRevision;
  checklist?: Checklist[];
  adjuntos?: Adjuntos[];
  adjuntosEvidencias?: Adjuntos[];
  cumplimiento: 'Total' | 'Parcial';
  observaciones?: string;
  aprobador: Persona['nombre'];
  evMadurezAplicativo?: string;
  mejoras?: Mejora[];
  completada: boolean;
}

export interface TeamMovilization {
  businessAmbassador?: Persona;
  solutionDeveloper?: Persona;
  solutionTester?: Persona;
  businessAdvisor?: Persona;
  technicalAdvisor?: Persona;
}

export interface Persona {
  id?: string;
  nombre: string;
  rol?: string;
  email?: string;
  habilidades?: string[];
}

export interface Checklist {
  label: string;
  checked?: boolean;
}

export interface Adjuntos {
  type: string;
  nombre: string;
  url: string;
  fechaAdjunto: string;
}

export interface Skill {
  tipo: string;
  nombre: string;
}

export interface Mejora {
  tipo: string;
  descripcion: string;
}

export interface SolicitudRevision {
  tipo: 'Revision' | 'Entrega' | 'Cierre';
  fechaSolicitud: string;
  horarioDisponibilidad: DisponibilidadPorDia;
  participantes?: Persona[];
  adjuntos?: Adjuntos[];
  listaAcuerdos?: Checklist[];
  cierreSolicitud: {
    completada: boolean;
    fechaDeRealizacion?: string;
  };
}

export interface BloqueHorario {
  start: string;
  end: string;
}

export interface DisponibilidadPorDia {
  [dia: string]: {
    bloques: BloqueHorario[];
  };
}
