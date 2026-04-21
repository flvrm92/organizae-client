export interface IProductSearch {
  id: string;
  code: number;
  name: string | null;
  price: number;
  currentStock?: number;
}
