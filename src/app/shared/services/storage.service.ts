import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Verifica si localStorage está disponible
   */
  private isLocalStorageAvailable(): boolean {
    return isPlatformBrowser(this.platformId) && 
           typeof window !== 'undefined' && 
           window.localStorage !== null && 
           typeof window.localStorage === 'object';
  }

  /**
   * Guarda un valor en localStorage
   */
  setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error(`Error setting localStorage item ${key}:`, error);
      }
    }
  }

  /**
   * Obtiene un valor de localStorage
   */
  getItem(key: string): string | null {
    if (this.isLocalStorageAvailable()) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error(`Error getting localStorage item ${key}:`, error);
        return null;
      }
    }
    return null;
  }

  /**
   * Elimina un valor de localStorage
   */
  removeItem(key: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing localStorage item ${key}:`, error);
      }
    }
  }

  /**
   * Limpia todo localStorage
   */
  clear(): void {
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  }

  /**
   * Guarda un objeto en localStorage (convierte a JSON)
   */
  setObject(key: string, value: any): void {
    try {
      const jsonValue = JSON.stringify(value);
      this.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error setting localStorage object ${key}:`, error);
    }
  }

  /**
   * Obtiene un objeto de localStorage (convierte desde JSON)
   */
  getObject<T>(key: string): T | null {
    try {
      const item = this.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting localStorage object ${key}:`, error);
      return null;
    }
  }

  /**
   * Verifica si una clave existe en localStorage
   */
  hasKey(key: string): boolean {
    if (this.isLocalStorageAvailable()) {
      try {
        return localStorage.getItem(key) !== null;
      } catch (error) {
        console.error(`Error checking localStorage key ${key}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Obtiene el tamaño de localStorage
   */
  getSize(): number {
    if (this.isLocalStorageAvailable()) {
      try {
        return localStorage.length;
      } catch (error) {
        console.error('Error getting localStorage size:', error);
        return 0;
      }
    }
    return 0;
  }
}
