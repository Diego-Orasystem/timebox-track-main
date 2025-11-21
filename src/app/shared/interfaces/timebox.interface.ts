import {
  Close,
  Entrega,
  KickOff,
  Persona,
  Planning,
  QaData,
  Refinement,
  Skill,
} from './fases-timebox.interface';

export interface Timebox {
  id: string;
  tipoTimebox: TimeboxType['id'];
  businessAnalyst?: Persona;
  fases: {
    planning?: Planning;
    kickOff?: KickOff;
    refinement?: Refinement;
    qa?: QaData;
    close?: Close;
  };
  entrega?: Entrega;
  publicacionOferta?: {
    solicitado: boolean;
    publicado?: boolean;
    fechaPublicacion?: string;
    postulaciones?: Postulacion[];
  };
  projectId: string;
  appId: string;
  compensacionEconomica: CompensacionEconomica;
  estado: 'En Definición' | 'Disponible' | 'En Ejecución' | 'Finalizado';
  created_at?: string;
}

export interface CompensacionEconomica {
  skills: Skill[];
  esfuerzoHH: number;
  entregaAnticipada: EntregaAnticipada;
}

export interface EntregaAnticipada {
  duracionEstimadaDias: number; // Ej: 14 días corridos
  valorBase: number; // Ej: $320
  bonificaciones?: BonificacionEntrega[];
}

export interface BonificacionEntrega {
  diasMaximos: number; // Ej: 5, 7, 10
  valorBonificado: number; // Ej: $450, $400, $360
}

export interface Postulacion {
  id: string;
  rol: string;
  desarrollador: string;
  fechaPostulacion: string;
  estadoSolicitud: string;
  asignacion: {
    asignado: boolean;
    fechaAsignacion?: string;
  };
}

export interface TimeboxCategory {
  id: string;
  nombre: string;
}

export interface TimeboxType {
  id: string;
  nombre: string;
  definicion?: string;
  categoriaId: string;
  entregablesComunes?: string[]; // Ej. ["Funcionalidades completas", "código fuente versionado"]
  evidenciasCierre?: string[]; // Ej. ["Capturas de pantalla", "video de demo"]
}
