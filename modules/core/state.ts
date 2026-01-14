/**
 * State Management
 *
 * Custom pub-sub state management for product data
 */

import type { ProductState } from '@/types';

type Subscriber = (state: ProductState[]) => void;

export class ProductStore {
  private products: ProductState[] = [];
  private subscribers = new Set<Subscriber>();

  /**
   * Subscribe to state changes
   */
  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  /**
   * Get current state
   */
  getState(): ProductState[] {
    return this.products;
  }

  /**
   * Update a product by dataId
   */
  updateProduct(product: ProductState): void {
    this.products = this.products.map((p) =>
      p.dataId === product.dataId ? { ...p, ...product } : p
    );
    this.notify();
  }

  /**
   * Set products array
   */
  setProducts(products: ProductState[]): void {
    this.products = products;
    this.notify();
  }

  /**
   * Reset state
   */
  reset(): void {
    this.products = [];
    this.notify();
  }

  /**
   * Notify all subscribers
   */
  private notify(): void {
    this.subscribers.forEach((fn) => fn(this.products));
  }

  /**
   * Find product by dataId
   */
  findProduct(dataId: string): ProductState | undefined {
    return this.products.find((p) => p.dataId === dataId);
  }
}
