import type { DashboardStats } from 'src/types/dashboard-stats';

import axios from 'src/lib/axios';

// ----------------------------------------------------------------------

export async function fetchBusinessDashboardStats(businessId: number): Promise<DashboardStats> {
  const res = await axios.get<DashboardStats>(`businesses/${businessId}/dashboard-stats/`);
  return res.data;
}
