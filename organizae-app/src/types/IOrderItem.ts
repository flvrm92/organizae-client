export interface IOrderItem {
  id: string;
  productId: string;
  productSnapshotName: string;
  quantity: number;
  discount: number;
  total: number;
  unitPrice: number;
}
