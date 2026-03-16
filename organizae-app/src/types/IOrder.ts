import { IOrderItem } from './IOrderItem';

export interface IOrder {
  id: string;
  code: number;
  customerId: string;
  customerName: string;
  statusId: string;
  statusName: string;
  subTotal: number;
  createdAt: string;
  updatedAt: string | null;
  orderItems: IOrderItem[] | null;
}
