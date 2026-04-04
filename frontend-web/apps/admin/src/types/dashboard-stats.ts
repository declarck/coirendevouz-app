// ----------------------------------------------------------------------

export type DashboardPastSlice = {
  total: number;
  by_status: Record<string, number>;
};

export type DashboardDailyRow = {
  date: string;
  total: number;
  by_status: Record<string, number>;
};

export type DashboardStats = {
  business_id: number;
  timezone: string;
  today: string;
  past: {
    yesterday: DashboardPastSlice & { date: string };
    last_7_days: DashboardPastSlice & {
      from: string;
      to: string;
      daily: DashboardDailyRow[];
    };
    last_30_days: DashboardPastSlice & { from: string; to: string };
  };
  future: {
    from: string;
    to: string;
    days: number;
    total: number;
    by_staff: { staff_id: number; display_name: string; count: number }[];
  };
  upcoming_leave: {
    staff_id: number;
    display_name: string;
    date: string;
    closed: boolean;
  }[];
};
