import { IAddress } from './IAddress';

export interface ICustomer {
  id: string;
  organizationId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  document: string | null;
  phone: string | null;
  cellPhone: string | null;
  addresses: IAddress[] | null;
}