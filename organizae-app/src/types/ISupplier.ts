import { IAddress } from './IAddress';

export interface ISupplier {
  id: string;
  organizationId: string;
  name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  cellPhone: string | null;
  addresses: IAddress[] | null;
}