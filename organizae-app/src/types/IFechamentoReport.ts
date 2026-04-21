export interface IFechamentoOrderItem {
  productSnapshotName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface IFechamentoReportRow {
  paymentId: string;
  paymentDate: string;
  paymentMethodName: string;
  paymentAmount: number;
  orderId: string;
  orderCode: number;
  customerName: string;
  statusName: string;
  orderSubTotal: number;
  orderTotalPaid: number;
  orderBalance: number;
  orderItems: IFechamentoOrderItem[];
}

export interface IFechamentoSummaryByMethod {
  paymentMethodName: string;
  total: number;
  count: number;
}

export interface IFechamentoSummaryByStatus {
  statusName: string;
  orderCount: number;
  paymentTotal: number;
}

export interface IFechamentoReportSummary {
  totalPayments: number;
  totalOrders: number;
  totalReceived: number;
  byPaymentMethod: IFechamentoSummaryByMethod[];
  byStatus: IFechamentoSummaryByStatus[];
}

export interface IFechamentoReport {
  summary: IFechamentoReportSummary;
  rows: IFechamentoReportRow[];
}
