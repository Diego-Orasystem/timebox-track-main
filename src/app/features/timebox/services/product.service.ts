import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Entregable, Product } from '../../../shared/interfaces/product.interface';
import { Timebox } from '../../../shared/interfaces/timebox.interface';
import { ApiService } from '../../../shared/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);

  constructor(private apiService: ApiService) {
    // Cargar proyectos desde el backend al inicializar
    this.loadProductsFromApi();
  }

  /**
   * Transforma un timebox del formato del backend al formato del frontend
   */
  private transformTimeboxFromBackend(timebox: any): Timebox {
    // console.log('🔍 transformTimeboxFromBackend - planning recibido:', timebox.fases?.planning);
    // console.log('🔍 transformTimeboxFromBackend - teamLeader recibido:', timebox.fases?.planning?.teamLeader);
    // console.log('🔍 transformTimeboxFromBackend - entregableId recibido:', timebox.entregable_id);
    return {
      ...timebox,
      // Mapear campos del backend al frontend
      tipoTimebox: timebox.tipo_timebox_id || timebox.tipoTimebox,
      entregableId: timebox.entregable_id,
      // Asegurar que fases existe con estructura básica y mapear correctamente
      fases: timebox.fases
        ? {
            planning: timebox.fases.planning
              ? {
                  ...timebox.fases.planning,
                  // Mapear campos específicos del backend
                  fechaInicio:
                    timebox.fases.planning.fecha_inicio ||
                    timebox.fases.planning.fechaInicio ||
                    '',
                  adjuntos: timebox.fases.planning.adjuntos,
                  // El teamLeader ya viene correctamente formateado desde la API
                  teamLeader: timebox.fases.planning.teamLeader || undefined,
                  // Los skills ya vienen correctamente formateados desde la API
                  skills: timebox.fases.planning.skills || [],
                  // El cumplimiento ya viene correctamente formateado desde la API
                  cumplimiento: timebox.fases.planning.cumplimiento || [],
                  // Agrego entreble id para usarlo desde el modal
                  entregableId: timebox.entregable_id || timebox.entregableId,
                }
              : undefined,
            kickOff: timebox.fases.kickOff
              ? {
                  ...timebox.fases.kickOff,
                  // Mapear campos específicos del backend si es necesario
                  fechaFase:
                    timebox.fases.kickOff.fecha_fase ||
                    timebox.fases.kickOff.fechaFase ||
                    '',
                }
              : undefined,
            refinement: timebox.fases.refinement,
            qa: timebox.fases.qa,
            close: timebox.fases.close,
          }
        : {
            planning: undefined,
            kickOff: undefined,
            refinement: undefined,
            qa: undefined,
            close: undefined,
          },
      // Asegurar que entrega existe
      entrega: timebox.entrega || undefined,
      // Asegurar que publicacionOferta existe
      publicacionOferta: timebox.publicacionOferta || undefined,
    };
  }

  /**
   * Carga los productos desde el backend
   */
  private loadProductsFromApi(): void {
    this.apiService
      .getData<{ status: boolean; message: string; data: Product[] }>(
        '/product/all'
      )
      .pipe(
        catchError((error) => {
          console.error('Error cargando productos:', error);
          return of({ status: false, message: 'Error', data: [] });
        })
      )
      .subscribe((response) => {
        if (response.status && response.data) {
          this.productsSubject.next(response.data);
        }
      });
  }

  /**
   * Obtiene todos los productos
   */
  getProjects(): Observable<Product[]> {
    return this.apiService
      .getData<{ status: boolean; message: string; data: Product[] }>(
        '/product/all'
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error obteniendo productos:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene un producto por ID
   */
  getProductById(id: string): Observable<Product> {
    return this.apiService
      .getData<{ status: boolean; message: string; data: Product }>(
        `/product/${id}`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error(`Error obteniendo producto ${id}:`, error);
          return throwError(
            () => new Error(`Producto con ID ${id} no encontrado`)
          );
        })
      );
  }

  /**
   * Crea un nuevo producto
   */
  createProduct(product: Product): Observable<Product> {
    const productData = {
      nombre  : product.nombre,
      descripcion: product.descripcion,
      idResponsable: product.idResponsable || null,
    };

    return this.apiService
      .post<{ status: boolean; message: string; data: Product }>(
        '/product',
        productData
      )
      .pipe(
        map((response) => {
          // Actualizar la lista local
          this.loadProductsFromApi();
          return response.data;
        }),
        catchError((error) => {
          console.error('Error creando producto:', error);
          return throwError(() => new Error('Error al crear el producto'));
        })
      );
  }

  /**
   * Actualiza un producto existente
   */
  updateProduct(id: string, updateData: Partial<Product>): Observable<Product> {
    return this.apiService
      .put<{ status: boolean; message: string; data: Product }>(
        `/product/${id}`,
        updateData
      )
      .pipe(
        map((response) => {
          // Actualizar la lista local
          this.loadProductsFromApi();
          return response.data;
        }),
        catchError((error) => {
          console.error(`Error actualizando proyecto ${id}:`, error);
          return throwError(
            () => new Error(`Error al actualizar el proyecto con ID ${id}`)
          );
        })
      );
  }

  /**
   * Elimina un proyecto
   */
  deleteProduct(id: string): Observable<boolean> {
    return this.apiService
      .delete<{ status: boolean; message: string }>(`/product/${id}`)
      .pipe(
        map((response) => {
          // Actualizar la lista local
          this.loadProductsFromApi();
          return response.status;
        }),
        catchError((error) => {
          console.error(`Error eliminando producto ${id}:`, error);
          return throwError(
            () => new Error(`Error al eliminar el producto con ID ${id}`)
          );
        })
      );
  }

  /**
   * Obtiene los timeboxes de un proyecto específico
   */
  getTimeboxesByEntregableId(entregableId: string): Observable<Timebox[]> {
    return this.apiService
      .getData<{ status: boolean; message: string; data: Timebox[] }>(
        `/product/${entregableId}/timeboxes`
      )
      .pipe(
        map((response) =>
          response.data.map((timebox) =>
            this.transformTimeboxFromBackend(timebox)
          )
        ),
        catchError((error) => {
          console.error(
            `Error obteniendo timeboxes del proyecto ${entregableId}:`,
            error
          );
          return of([]);
        })
      );
  }

  /**
   * Actualiza un timebox en un proyecto
   */
  updateTimebox(entregableId: string, timebox: Timebox): Observable<Timebox> {
    // Mapear los campos del frontend al formato esperado por el backend
    const timeboxData = {
      tipoTimeboxId: timebox.tipoTimebox, // Mapear tipoTimebox a tipoTimeboxId
      businessAnalystId: timebox.businessAnalyst?.nombre || null,
      estado: timebox.estado,
      // Enviar las fases completas
      fases: timebox.fases || {},
      entrega: timebox.entrega || null,
      publicacionOferta: timebox.publicacionOferta || null,
    };

    return this.apiService
      .put<{ status: boolean; message: string; data: Timebox }>(
        `/product/${entregableId}/timeboxes/${timebox.id}`,
        timeboxData
      )
      .pipe(
        map((response) => {
          const transformedTimebox = this.transformTimeboxFromBackend(
            response.data
          );
          return transformedTimebox;
        }),
        catchError((error) => {
          console.error(
            `Error actualizando timebox ${timebox.id} en proyecto ${entregableId}:`,
            error
          );
          return throwError(
            () => new Error(`Error al actualizar timebox con ID ${timebox.id}`)
          );
        })
      );
  }

  /**
   * Crea un nuevo timebox en un proyecto
   */
  createTimebox(
    entregableId: string,
    timebox: Omit<Timebox, 'id'>
  ): Observable<Timebox> {
    // Mapear los campos del frontend al formato esperado por el backend
    const timeboxData = {
      tipoTimeboxId: timebox.tipoTimebox, // Mapear tipoTimebox a tipoTimeboxId
      projectId: entregableId,
      businessAnalystId: timebox.businessAnalyst?.nombre || null,
      estado: timebox.estado || 'En Definición',
      // Enviar las fases completas
      fases: timebox.fases || {},
      entrega: timebox.entrega || null,
      publicacionOferta: timebox.publicacionOferta || null,
      entregableId: timebox.entregableId,
    };

    return this.apiService
      .post<{ status: boolean; message: string; data: Timebox }>(
        `/product/${entregableId}/timeboxes`,
        timeboxData
      )
      .pipe(
        map((response) => this.transformTimeboxFromBackend(response.data)),
        catchError((error) => {
          console.error(
            `Error creando timebox en proyecto ${entregableId}:`,
            error
          );
          return throwError(() => new Error('Error al crear el timebox'));
        })
      );
  }

  /**
   * router.get('/details/product/:productId', productIdValidation, ProductController.getEntregablesDetailsByProduct);
   * Obtiene los detalles de los entregables asociados a un producto
   * 
   */
  getEntregablesDetailsByProduct(productId: string): Observable<Entregable[]> {
    return this.apiService
      .getData<{ status: boolean; message: string; data: any[] }>(
        `/product/details/${productId}`
      )
      .pipe(
        switchMap((resp) => {
          const data = resp?.data ?? [];

          // Entregables base SIN timeboxes aún
          const baseEntregables = data.map((e: any) => ({
            id: e.id,
            nombre: e.nombre,
            tipo: e.tipo,
            descripcion: e.descripcion,
            productId: e.productId ?? e.project_id,
          }));

          if (!baseEntregables.length) {
            return of<Entregable[]>([]);
          }

          // Para cada entregable, traemos sus timeboxes con getTimeboxesByEntregableId
          return forkJoin(
            baseEntregables.map((ent) =>
              this.getTimeboxesByEntregableId(ent.id).pipe(
                map((tbs) => {
                  // console.log(
                  //   '📦 getTimeboxesByEntregableId',
                  //   ent.id,
                  //   ent.nombre,
                  //   '→ timeboxes desde getTimeboxesByEntregableId:',
                  //   tbs.map((tb) => ({
                  //     id: tb.id,
                  //     fechaInicio: tb.fases?.planning?.fechaInicio,
                  //     entregableId: tb.entregableId,
                  //   }))
                  // );
                  return {
                    ...ent,
                    timeboxes: tbs,
                  } as Entregable;
                })
              )
            )
          );
        }),
        catchError((error) => {
          console.error(
            `Error obteniendo detalles de entregables del producto ${productId}:`,
            error
          );
          return of<Entregable[]>([]);
        })
      );
  }

  /**
   * Recarga los proyectos (para uso interno)
   */
  reloadProducts(): void {
    this.loadProductsFromApi();
  }
}
