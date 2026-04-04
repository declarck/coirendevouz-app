/** `GET/POST/PATCH .../staff/` ile uyumlu personel. */
export type Staff = {
  id: number;
  display_name: string;
  is_active: boolean;
  service_ids: number[];
  user_id: number | null;
  working_hours: Record<string, unknown> | null;
  working_hours_exceptions?: Array<Record<string, unknown>> | null;
};

export type StaffWritePayload = {
  display_name: string;
  working_hours?: Record<string, unknown> | null;
  working_hours_exceptions?: Array<Record<string, unknown>> | null;
  is_active?: boolean;
  /** DRF `user` alanı — kullanıcı PK veya bağlantıyı kaldırmak için `null`. */
  user?: number | null;
};
