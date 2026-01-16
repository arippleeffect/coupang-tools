import type { ProductState } from "@/types";

type Subscriber = (state: ProductState[]) => void;

/**
 * 상품 상태 관리 스토어
 * 구독자 패턴을 사용하여 상품 상태 변경을 알림
 */
export class ProductStore {
  private products: ProductState[] = [];
  private subscribers = new Set<Subscriber>();

  /**
   * 상태 변경 구독
   * @param fn - 상태 변경 시 호출될 콜백 함수
   * @returns 구독 해제 함수
   */
  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  /**
   * 현재 상품 상태 목록 조회
   * @returns 상품 상태 배열
   */
  getState(): ProductState[] {
    return this.products;
  }

  /**
   * 특정 상품 상태 업데이트
   * @param product - 업데이트할 상품 상태
   */
  updateProduct(product: ProductState): void {
    this.products = this.products.map((p) =>
      p.dataId === product.dataId ? { ...p, ...product } : p
    );
    this.notify();
  }

  /**
   * 상품 목록 전체 설정
   * @param products - 설정할 상품 상태 배열
   */
  setProducts(products: ProductState[]): void {
    this.products = products;
    this.notify();
  }

  /**
   * 상품 목록 초기화
   */
  reset(): void {
    this.products = [];
    this.notify();
  }

  /**
   * 구독자에게 상태 변경 알림
   */
  private notify(): void {
    this.subscribers.forEach((fn) => fn(this.products));
  }

  /**
   * dataId로 상품 찾기
   * @param dataId - 상품 데이터 ID
   * @returns 찾은 상품 상태 또는 undefined
   */
  findProduct(dataId: string): ProductState | undefined {
    return this.products.find((p) => p.dataId === dataId);
  }
}
