export interface IFilterSubcategoryOption {
  id: string;
  name: string;
}

export interface IFilterCategoryOption {
  id: string;
  name: string;
  subcategories: IFilterSubcategoryOption[];
}

export interface IFilterStatusOption {
  id: string;
  name: string;
}

export interface IProductFilterMetadata {
  categories: IFilterCategoryOption[];
  statuses: IFilterStatusOption[];
  sizes: string[];
  colors: string[];
  tags: string[];
}
