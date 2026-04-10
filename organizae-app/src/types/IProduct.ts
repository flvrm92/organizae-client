export interface IProduct {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  organizationId: string;
  statusId: string;
  statusName: string | null;
  price: number;
  unitOfMeasureId: string | null;
  unitOfMeasureName: string | null;
  unitOfMeasureAbbreviation: string | null;
  size: string | null;
  color: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subCategoryId: string | null;
  subCategoryName: string | null;
}
