export interface IProduct {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  organizationId: string;
  statusId: string;
  statusName: string | null;
  price: number;
}
