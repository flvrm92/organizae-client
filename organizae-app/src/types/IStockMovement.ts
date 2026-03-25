export interface IStockMovementItem {
  productId: string;
  productName: string | null;
  quantity: number;
  direction: string | null;
  reason: string | null;
  value: number | null;
}

export interface IStockMovement {
  id: string;
  productId: string;
  productName: string | null;
  quantity: number;
  direction: string | null;
  reason: string | null;
  referenceType: string | null;
  referenceId: string;
  createdAt: string;
}

export interface IStockMovementProductSummary {
  productId: string;
  productName: string | null;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  movements: IStockMovement[] | null;
}
