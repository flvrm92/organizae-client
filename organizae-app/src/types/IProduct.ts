export interface IProduct {
  id: string;
  code: number;
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
  tags: string[];
  currentStock?: number;
  costPrice: number;
  gainPercentage: number;
}
