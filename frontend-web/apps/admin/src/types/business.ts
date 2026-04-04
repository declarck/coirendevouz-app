/** `GET /businesses/mine/` ve liste şeması ile uyumlu özet. */
export type BusinessSummary = {
  id: number;
  name: string;
  slug: string;
  category: string;
  city: string;
  district: string;
  latitude: string | number | null;
  longitude: string | number | null;
  is_active: boolean;
};

export type PaginatedResults<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
