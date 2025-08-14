import { Adjuntos, Persona, TeamMovilization } from './fases-timebox.interface';

export interface OrdenDePago {
  idOrden: string;
  fechaOrdenDePago: string;
  dataTimebox: {
    idTimebox: string;
    nombreTimebox: string;
    fechaEntrega: string;
    teamMovilization: TeamMovilization;
  };
  ordenDePago: ItemsOrdenPago[];
  estado: 'Solicitado' | 'Aprobado' | 'Pagado' | 'Rechazado';
}

export interface OrdenDePagoIndividual {
  idOrden: string;
  fechaOrdenDePago: string;
  dataTimebox: {
    idTimebox: string;
    nombreTimebox: string;
    fechaEntrega: string;
  };
  ordenDePago: ItemsOrdenPago;
}

export interface ItemsOrdenPago {
  colaborador: Persona;
  montoBase: number;
  porcentajeEntregaAnt: number;
  glosa: string;
  documentoFacturacion?: Adjuntos;
  pago?: DetallePago;
  estado: 'Solicitado' | 'Aprobado' | 'Pagado' | 'Rechazado'; // Estado individual del pago
}

export interface DetallePago {
  idPago: string;
  fechaPago?: string;
  comprobantePago: Adjuntos;
  montoPagado?: number;
}
