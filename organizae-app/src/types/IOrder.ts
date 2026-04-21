import { IOrderItem } from './IOrderItem';
import { IOrderPayment } from './IOrderPayment';

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
  payments: IOrderPayment[];
  totalPaid: number;
  balance: number;
  hasPayments: boolean;
}
