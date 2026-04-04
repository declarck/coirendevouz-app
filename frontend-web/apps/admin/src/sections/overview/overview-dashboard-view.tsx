import type { ChartOptions } from 'src/components/chart/types';
import type { DashboardStats } from 'src/types/dashboard-stats';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { fetchBusinessDashboardStats } from 'src/api/business-dashboard';
import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { Chart } from 'src/components/chart';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_STACK_ORDER = [
  'completed',
  'cancelled',
  'no_show',
  'confirmed',
  'pending',
] as const;

function countForStatus(by: Record<string, number> | undefined, s: string): number {
  if (!by) {
    return 0;
  }
  return by[s] ?? 0;
}

export function OverviewDashboardView() {
  const theme = useTheme();
  const { t, i18n } = useTranslate('coirendevouz');
  const intlLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'tr-TR';
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id;

  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (businessId == null) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBusinessDashboardStats(businessId);
      setData(res);
    } catch (e) {
      setData(null);
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusMeta = useMemo(
    () =>
      STATUS_STACK_ORDER.map((key) => ({
        key,
        label: t(`appointmentStatus.${key}`),
        color:
          key === 'completed'
            ? theme.palette.success.main
            : key === 'cancelled'
              ? theme.palette.error.main
              : key === 'no_show'
                ? theme.palette.warning.dark
                : key === 'confirmed'
                  ? theme.palette.info.main
                  : theme.palette.grey[500],
      })),
    [t, theme.palette]
  );

  const dailyChart = useMemo(() => {
    if (!data?.past.last_7_days.daily.length) {
      return { series: [] as { name: string; data: number[] }[], options: {} as ChartOptions };
    }
    const daily = data.past.last_7_days.daily;
    const categories = daily.map((row) => {
      const d = new Date(`${row.date}T12:00:00`);
      return d.toLocaleDateString(intlLocale, { weekday: 'short', day: 'numeric', month: 'short' });
    });
    const series = STATUS_STACK_ORDER.map((status) => ({
      name: t(`appointmentStatus.${status}`),
      data: daily.map((row) => countForStatus(row.by_status, status)),
    }));
    const options: ChartOptions = {
      chart: { stacked: true, toolbar: { show: false } },
      plotOptions: { bar: { columnWidth: '58%', borderRadius: 2 } },
      stroke: { show: false },
      dataLabels: { enabled: false },
      xaxis: { categories, labels: { rotate: -45 } },
      legend: { position: 'top', horizontalAlign: 'left' },
      colors: statusMeta.map((m) => m.color),
      tooltip: { shared: true, intersect: false },
    };
    return { series, options };
  }, [data, intlLocale, statusMeta, t]);

  const staffBarChart = useMemo(() => {
    const rows = data?.future.by_staff ?? [];
    if (!rows.length) {
      return { series: [] as { name: string; data: number[] }[], options: {} as ChartOptions };
    }
    const options: ChartOptions = {
      chart: { toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '70%' } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: rows.map((r) => r.display_name),
        labels: { maxHeight: 120 },
      },
      colors: [theme.palette.primary.main],
      tooltip: { y: { formatter: (val: number) => String(val) } },
    };
    return {
      series: [{ name: t('overviewDashboard.futurePerStaff'), data: rows.map((r) => r.count) }],
      options,
    };
  }, [data?.future.by_staff, t, theme.palette.primary.main]);

  if (businessId == null) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('overviewDashboard.selectBusiness')}
      </Alert>
    );
  }

  if (loading && !data) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('common.loading')}
      </Typography>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => void load()}>
          {t('common.tryAgain')}
        </Button>
      </Stack>
    );
  }

  if (!data) {
    return null;
  }

  const py = data.past.yesterday;
  const p7 = data.past.last_7_days;
  const p30 = data.past.last_30_days;
  const fu = data.future;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          component={RouterLink}
          href={paths.dashboard.coirendevouz.schedule}
          variant="outlined"
          startIcon={<Iconify icon="solar:calendar-date-bold" />}
        >
          {t('nav.schedule')}
        </Button>
        <Button
          component={RouterLink}
          href={paths.dashboard.coirendevouz.manualAppointment}
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          {t('nav.manualAppointment')}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={t('overviewDashboard.cardYesterday')} subheader={py.date} />
            <CardContent>
              <Typography variant="h3">{py.total}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('overviewDashboard.completedVsCancelled', {
                  done: countForStatus(py.by_status, 'completed'),
                  cancelled: countForStatus(py.by_status, 'cancelled'),
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('overviewDashboard.card7d')}
              subheader={`${p7.from} — ${p7.to}`}
            />
            <CardContent>
              <Typography variant="h3">{p7.total}</Typography>
              <Divider sx={{ my: 1.5 }} />
              <MiniBreakdown by={p7.by_status} t={t} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('overviewDashboard.card30d')}
              subheader={`${p30.from} — ${p30.to}`}
            />
            <CardContent>
              <Typography variant="h3">{p30.total}</Typography>
              <Divider sx={{ my: 1.5 }} />
              <MiniBreakdown by={p30.by_status} t={t} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader title={t('overviewDashboard.chart7dTitle')} subheader={t('overviewDashboard.chart7dSub')} />
        <CardContent>
          <Box sx={{ height: 360, width: '100%' }}>
            {dailyChart.series.length ? (
              <Chart type="bar" series={dailyChart.series} options={dailyChart.options} sx={{ height: 1 }} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('overviewDashboard.noData')}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('overviewDashboard.futureTitle')}
              subheader={t('overviewDashboard.futureSub', {
                from: fu.from,
                to: fu.to,
                total: fu.total,
              })}
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('overviewDashboard.futureHint')}
              </Typography>
              <Box sx={{ height: Math.max(220, (data.future.by_staff.length || 1) * 48), width: '100%' }}>
                {staffBarChart.series.length ? (
                  <Chart
                    type="bar"
                    series={staffBarChart.series}
                    options={staffBarChart.options}
                    sx={{ height: 1 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('overviewDashboard.noFutureAppointments')}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={t('overviewDashboard.leaveTitle')} subheader={t('overviewDashboard.leaveSub')} />
            <CardContent>
              {data.upcoming_leave.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('overviewDashboard.noLeave')}
                </Typography>
              ) : (
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  {data.upcoming_leave.map((row) => (
                    <Stack key={`${row.staff_id}-${row.date}`} direction="row" justifyContent="space-between">
                      <Typography variant="subtitle2">{row.display_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(`${row.date}T12:00:00`).toLocaleDateString(intlLocale, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function MiniBreakdown({
  by,
  t,
}: {
  by: Record<string, number>;
  t: (k: string, o?: Record<string, unknown>) => string;
}) {
  const parts = STATUS_STACK_ORDER.filter((s) => countForStatus(by, s) > 0).map(
    (s) => `${t(`appointmentStatus.${s}`)}: ${countForStatus(by, s)}`
  );
  if (!parts.length) {
    return (
      <Typography variant="caption" color="text.disabled">
        {t('overviewDashboard.noAppointmentsInRange')}
      </Typography>
    );
  }
  return (
    <Typography variant="caption" color="text.secondary" component="div">
      {parts.join(' · ')}
    </Typography>
  );
}
