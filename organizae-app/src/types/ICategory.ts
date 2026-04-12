export interface ICategory {
  id: string;
  name: string;
  organizationId: string;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
}
