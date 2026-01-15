import type { ProductState } from "@/types";

type Subscriber = (state: ProductState[]) => void;

export class ProductStore {
  private products: ProductState[] = [];
  private subscribers = new Set<Subscriber>();

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getState(): ProductState[] {
    return this.products;
  }

  updateProduct(product: ProductState): void {
    this.products = this.products.map((p) =>
      p.dataId === product.dataId ? { ...p, ...product } : p
    );
    this.notify();
  }

  setProducts(products: ProductState[]): void {
    this.products = products;
    this.notify();
  }

  reset(): void {
    this.products = [];
    this.notify();
  }

  private notify(): void {
    this.subscribers.forEach((fn) => fn(this.products));
  }

  findProduct(dataId: string): ProductState | undefined {
    return this.products.find((p) => p.dataId === dataId);
  }
}
