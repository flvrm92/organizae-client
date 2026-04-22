export interface IProductListFilters {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  statusId?: string;
  sizes: string[];
  colors: string[];
  tags: string[];
}
