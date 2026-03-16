export interface IAddress {
  id: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  zipCode: string | null;
  isPrimary: boolean;
}