import { IStockMovementItem } from './IStockMovement';

export interface IStockEntry {
  id: string;
  supplierId: string;
  supplierName: string | null;
  movements: IStockMovementItem[] | null;
  createdAt: string;
}
