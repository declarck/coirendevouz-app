/** `GET/POST/PATCH .../services/` ile uyumlu hizmet satırı. */
export type Service = {
  id: number;
  name: string;
  duration_minutes: number;
  price: string | number;
  is_active: boolean;
};

export type ServiceWritePayload = {
  name: string;
  duration_minutes: number;
  price: number | string;
  is_active?: boolean;
};
