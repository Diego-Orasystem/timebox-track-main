import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../../../shared/interfaces/product.interface';
import { ProductModalComponent } from '../../../../../shared/components/modals/item-creation-modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductModalComponent],
  template: `
    <div class="p-10 flex flex-col gap-10 w-full">
      <div class="header flex items-center justify-between w-full">
        <div class="flex flex-col place-content-center select-none">
          <h1 class="text-md font-extrabold text-[var(--text-dark)]">
            Gestión de Productos
          </h1>
          <p class="text-sm text-[var(--text-medium)]">
            Visualiza y organiza tus productos.
          </p>
        </div>
        <button
          (click)="openModal('create')"
          class="max-w-40 cursor-pointer text-[12px] space-x-1 inline-flex items-center justify-between px-5 py-3 bg-[var(--primary)] text-[var(--lightText)] rounded-sm hover:bg-[var(--primaryDark)] transition-colors duration-200"
        >
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="#FFFFFF"
            stroke="#FFFFFF"
          >
            <g id="Complete">
              <g data-name="add" id="add-2">
                <g>
                  <line
                    fill="none"
                    stroke="#FFFFFF"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    x1="12"
                    x2="12"
                    y1="19"
                    y2="5"
                  ></line>
                  <line
                    fill="none"
                    stroke="#FFFFFF"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    x1="5"
                    x2="19"
                    y1="12"
                    y2="12"
                  ></line>
                </g>
              </g>
            </g>
          </svg>
          <span class="text-xs font-medium">Crear Producto</span>
        </button>
      </div>

      <div class="Table">
        <div
          *ngIf="products.length > 0; else noProducts"
          class="flex flex-col gap-4"
        >
          <div
            *ngFor="let product of products"
            class="relative inline-flex justify-between p-6 rounded-sm shadow-sm hover:shadow-md transition border border-transparent ease-in-out hover:border hover:border-[var(--lines)] cursor-pointer"
            [style.background-color]="'var(--backgroundLight)'"
          >
            <div class="flex flex-col" (click)="selectProduct(product)">
              <h3 class="text-xs font-mono" [style.color]="'var(--text-light)'">
                ID:
                <span
                  class="font-semibold"
                  [style.color]="'var(--text-medium)'"
                >
                  {{ product.id }}
                </span>
              </h3>
              <h2 class="text-lg font-semibold text-[var(--text-dark)]">
                {{ product.nombre }}
              </h2>
              <p class="text-sm text-gray-600">{{ product.descripcion }}</p>
              <p class="text-xs text-gray-500 italic mt-2">
                {{ product.fechaCreacion || 'Creado recientemente' }}
              </p>
            </div>

            <!-- Botón de menú -->
            <div class="relative inline-block text-left">
              <button
                (click)="toggleMenu(product.id, $event)"
                class="rounded-full p-2 hover:bg-slate-100 duration-200 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                  />
                </svg>
              </button>

              <!-- Dropdown -->
              <div
                *ngIf="openMenuId === product.id"
                class="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50"
              >
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  (click)="editProduct(product)"
                >
                  Editar
                </button>
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 cursor-pointer"
                  (click)="deleteProduct(product)"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noProducts>
          <p class="text-center text-gray-500">No hay productos creados.</p>
        </ng-template>
      </div>
    </div>

    <!-- Modal reutilizable -->
    <app-product-modal
      [show]="showModal"
      [mode]="modalMode"
      [productData]="selectedProduct"
      (close)="closeModal()"
      (productSaved)="handleProductSaved($event)"
    ></app-product-modal>
  `,
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedProduct: Product | null = null;
  openMenuId: string | null = null; // Controla el menú desplegado

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();
    document.addEventListener('click', () => (this.openMenuId = null));
  }

  loadProducts(): void {
    this.productService.getProjects().subscribe({
      next: (projects: Product[]) => (this.products = projects),
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.products = [];
      },
    });
  }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  selectProduct(product: Product): void {
    this.router.navigate(['products', product.id]);
  }

  openModal(mode: 'create' | 'edit', product?: Product): void {
    this.modalMode = mode;
    this.selectedProduct = product || null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  editProduct(product: Product): void {
    this.openMenuId = null;
    this.openModal('edit', product);
  }

  deleteProduct(product: Product): void {
    this.openMenuId = null;
    const confirmed = confirm(
      `¿Seguro que deseas eliminar "${product.nombre}"?`
    );
    if (!confirmed) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter((p) => p.id !== product.id);
        console.log('🗑️ Producto eliminado:', product);
      },
      error: (err) => {
        console.error('❌ Error al eliminar producto:', err);
        alert('Error al eliminar el producto.');
      },
    });
  }

  handleProductSaved(product: Product): void {
    if (this.modalMode === 'create') {
      this.productService
        .createProduct(product.nombre, product.descripcion || '')
        .subscribe({
          next: (newProduct: Product) => {
            this.products.unshift(newProduct);
            console.log('✅ Nuevo producto creado:', newProduct);
          },
          error: (error: any) => {
            console.error('❌ Error creando producto:', error);
            alert('Error al crear el producto.');
          },
        });
    } else if (this.modalMode === 'edit') {
      this.productService.updateProduct(product.id, product).subscribe({
        next: (updated: Product) => {
          const index = this.products.findIndex((p) => p.id === product.id);
          if (index !== -1) this.products[index] = updated;
          console.log('📝 Producto actualizado:', updated);
        },
        error: (error: any) => {
          console.error('❌ Error actualizando producto:', error);
        },
      });
    }

    this.closeModal();
  }
}
