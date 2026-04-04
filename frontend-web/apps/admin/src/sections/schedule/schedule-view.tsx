import type { EventContentArg } from '@fullcalendar/core';
import type { IconButtonProps } from '@mui/material/IconButton';
import type { ScheduleAppointment } from 'src/types/schedule';

import Calendar from '@fullcalendar/react';
import { useNavigate } from 'react-router';
import timeGridPlugin from '@fullcalendar/timegrid';
import trLocale from '@fullcalendar/core/locales/tr';
import interactionPlugin from '@fullcalendar/interaction';
import enGbLocale from '@fullcalendar/core/locales/en-gb';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import TableContainer from '@mui/material/TableContainer';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { fetchAllStaff } from 'src/api/business-staff';
import { DashboardContent } from 'src/layouts/dashboard';
import { fetchSchedule } from 'src/api/business-schedule';
import { useBusinessContext } from 'src/contexts/business/use-business-context';
import {
  addDaysIstanbul,
  getIstanbulToday,
  formatScheduleRangeTitle,
  getMondayToSundayRangeContaining,
} from 'src/lib/istanbul-date';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CalendarRoot } from 'src/sections/calendar/styles';

// ----------------------------------------------------------------------

type StaffFilterOption = { id: number; label: string };

function statusColor(
  status: string
): 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'confirmed':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
    case 'no_show':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
}

function formatAppointmentWindow(isoStart: string, isoEnd: string, intlLocale: string): string {
  const s = new Date(isoStart);
  const e = new Date(isoEnd);
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  return `${s.toLocaleString(intlLocale, opts)} – ${e.toLocaleTimeString(intlLocale, {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Takvim butonunda yalnızca başlangıç saati (İstanbul), örn. 09:00 */
function formatAppointmentStartHm(isoStart: string, intlLocale: string): string {
  return new Date(isoStart).toLocaleTimeString(intlLocale, {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function ScheduleView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslate('coirendevouz');
  const intlLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'tr-TR';
  const dayjsLocale = i18n.language?.startsWith('en') ? 'en' : 'tr';
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id;

  const [mode, setMode] = useState<'day' | 'week'>('week');
  const [layoutView, setLayoutView] = useState<'list' | 'calendar'>('list');
  const [anchorDate, setAnchorDate] = useState(() => getIstanbulToday());
  const [statusFilter, setStatusFilter] = useState('');
  const [staffOptions, setStaffOptions] = useState<StaffFilterOption[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [rows, setRows] = useState<ScheduleAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fcLocale = i18n.language?.startsWith('en') ? enGbLocale : trLocale;

  const appointmentColor = useCallback(
    (status: string) => {
      const p = theme.palette;
      switch (status) {
        case 'confirmed':
          return p.info.main;
        case 'completed':
          return p.success.main;
        case 'cancelled':
        case 'no_show':
          return p.error.main;
        case 'pending':
          return p.warning.main;
        default:
          return p.grey[500];
      }
    },
    [theme.palette]
  );

  const calendarEvents = useMemo(
    () =>
      rows.map((row) => ({
        id: String(row.id),
        title: `${row.service.name} — ${row.customer.full_name}`,
        start: row.starts_at,
        end: row.ends_at,
        backgroundColor: appointmentColor(row.status),
        borderColor: appointmentColor(row.status),
        extendedProps: { appointment: row },
      })),
    [rows, appointmentColor]
  );

  const range = useMemo(() => {
    if (mode === 'day') {
      return { from: anchorDate, to: anchorDate };
    }
    return getMondayToSundayRangeContaining(anchorDate);
  }, [mode, anchorDate]);

  const rangeTitle = useMemo(
    () => formatScheduleRangeTitle(range.from, range.to, mode, dayjsLocale),
    [range.from, range.to, mode, dayjsLocale]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: '', label: t('schedule.statusAll') },
      { value: 'pending', label: t('appointmentStatus.pending') },
      { value: 'confirmed', label: t('appointmentStatus.confirmed') },
      { value: 'completed', label: t('appointmentStatus.completed') },
      { value: 'cancelled', label: t('appointmentStatus.cancelled') },
      { value: 'no_show', label: t('appointmentStatus.no_show') },
    ],
    [t]
  );

  const getStatusLabel = useCallback(
    (status: string) => t(`appointmentStatus.${status}`, { defaultValue: status }),
    [t]
  );

  useEffect(() => {
    if (businessId == null) {
      setStaffOptions([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchAllStaff(businessId);
        if (!cancelled) {
          setStaffOptions(
            all.filter((s) => s.is_active).map((s) => ({ id: s.id, label: s.display_name }))
          );
        }
      } catch {
        if (!cancelled) {
          setStaffOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const load = useCallback(async () => {
    if (businessId == null) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSchedule(businessId, {
        from: range.from,
        to: range.to,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(selectedStaffIds.length ? { staffIds: selectedStaffIds } : {}),
      });
      setRows(data.appointments);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [businessId, range.from, range.to, statusFilter, selectedStaffIds]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePrev = useCallback(() => {
    const step = mode === 'day' ? 1 : 7;
    setAnchorDate((prev) => addDaysIstanbul(prev, -step));
  }, [mode]);

  const handleNext = useCallback(() => {
    const step = mode === 'day' ? 1 : 7;
    setAnchorDate((prev) => addDaysIstanbul(prev, step));
  }, [mode]);

  const handleToday = useCallback(() => {
    setAnchorDate(getIstanbulToday());
  }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('schedule.heading')}
        links={[
          { name: t('common.panel'), href: paths.dashboard.root },
          { name: t('schedule.heading') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.coirendevouz.manualAppointment}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('nav.manualAppointment')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack
          spacing={2}
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => {
              if (v != null) {
                setMode(v);
              }
            }}
            size="small"
          >
            <ToggleButton value="day">{t('schedule.modeDay')}</ToggleButton>
            <ToggleButton value="week">{t('schedule.modeWeek')}</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={layoutView}
            exclusive
            onChange={(_, v) => {
              if (v != null) {
                setLayoutView(v);
              }
            }}
            size="small"
          >
            <ToggleButton value="list">{t('schedule.viewList')}</ToggleButton>
            <ToggleButton value="calendar">{t('schedule.viewCalendar')}</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <NavIconButton aria-label={t('schedule.prev')} onClick={handlePrev} icon="eva:arrow-ios-back-fill" />
            <NavIconButton aria-label={t('schedule.next')} onClick={handleNext} icon="eva:arrow-ios-forward-fill" />
            <Button size="small" variant="outlined" onClick={handleToday}>
              {t('common.today')}
            </Button>
          </Stack>

          <TextField
            label={t('schedule.refDate')}
            type="date"
            size="small"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 180 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="schedule-status-filter">{t('common.status')}</InputLabel>
            <Select
              labelId="schedule-status-filter"
              label={t('common.status')}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusFilterOptions.map((o) => (
                <MenuItem key={o.value || 'all'} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            disableCloseOnSelect
            size="small"
            options={staffOptions}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={staffOptions.filter((o) => selectedStaffIds.includes(o.id))}
            onChange={(_, v) => setSelectedStaffIds(v.map((x) => x.id))}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('schedule.staff')}
                placeholder={selectedStaffIds.length ? '' : t('common.all')}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.id} label={option.label} size="small" />
              ))
            }
            sx={{ minWidth: { xs: '100%', md: 280 }, maxWidth: { md: 400 } }}
            slotProps={{ listbox: { sx: { maxHeight: 280 } } }}
          />

          <Button
            size="small"
            variant="soft"
            onClick={() => void load()}
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            {t('common.refresh')}
          </Button>
        </Stack>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
          {rangeTitle}
          <Box component="span" sx={{ ml: 1, opacity: 0.8 }}>
            ({range.from} — {range.to})
          </Box>
        </Typography>
      </Card>

      <Card>
        {layoutView === 'calendar' ? (
          <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {loading ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                {t('common.loading')}
              </Typography>
            ) : rows.length === 0 ? (
              <EmptyContent
                title={t('schedule.emptyAppointments')}
                description={t('schedule.emptyDescription')}
                sx={{ py: 6 }}
              />
            ) : (
              <CalendarRoot
                sx={{
                  minHeight: 520,
                  '& .fc.fc-media-screen': { minHeight: 480 },
                  '& .fc-timegrid-event': {
                    minHeight: 32,
                  },
                  /* Demo takvim stillerindeki beyaz kart + ::before — durum rengi butonu görünsün */
                  '& .fc-timegrid-event .fc-event-main': {
                    padding: '2px !important',
                    backgroundColor: 'transparent !important',
                    borderRadius: 1,
                    boxShadow: 'none',
                    '&::before': { display: 'none' },
                  },
                  '& .fc-timegrid-event .fc-event-main-frame': {
                    filter: 'none',
                  },
                }}
              >
                <Calendar
                  key={`${range.from}-${range.to}-${mode}`}
                  plugins={[timeGridPlugin, interactionPlugin]}
                  initialView={mode === 'day' ? 'timeGridDay' : 'timeGridWeek'}
                  initialDate={anchorDate}
                  locale={fcLocale}
                  headerToolbar={false}
                  events={calendarEvents}
                  slotMinTime="06:00:00"
                  slotMaxTime="23:00:00"
                  allDaySlot={false}
                  height="auto"
                  contentHeight="auto"
                  nowIndicator
                  eventMinHeight={32}
                  eventContent={(arg) => (
                    <ScheduleCalendarEventContent
                      arg={arg}
                      intlLocale={intlLocale}
                      getStatusLabel={getStatusLabel}
                    />
                  )}
                  eventClick={(arg) => {
                    navigate(paths.dashboard.coirendevouz.appointmentDetail(Number(arg.event.id)));
                  }}
                />
              </CalendarRoot>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="medium" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('schedule.colTime')}</TableCell>
                  <TableCell>{t('schedule.colService')}</TableCell>
                  <TableCell>{t('schedule.colStaff')}</TableCell>
                  <TableCell>{t('schedule.colCustomer')}</TableCell>
                  <TableCell>{t('schedule.colPhone')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        {t('common.loading')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ border: 'none' }}>
                      <EmptyContent
                        title={t('schedule.emptyAppointments')}
                        description={t('schedule.emptyDescription')}
                        sx={{ py: 6 }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      component={RouterLink}
                      href={paths.dashboard.coirendevouz.appointmentDetail(row.id)}
                      sx={{
                        cursor: 'pointer',
                        color: 'inherit',
                        textDecoration: 'none',
                        verticalAlign: 'middle',
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatAppointmentWindow(row.starts_at, row.ends_at, intlLocale)}
                      </TableCell>
                      <TableCell>{row.service.name}</TableCell>
                      <TableCell>{row.staff.display_name}</TableCell>
                      <TableCell>{row.customer.full_name}</TableCell>
                      <TableCell>{row.customer.phone || '—'}</TableCell>
                      <TableCell>
                        <Label color={statusColor(row.status)} variant="soft">
                          {getStatusLabel(row.status)}
                        </Label>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ScheduleCalendarEventContentProps = {
  arg: EventContentArg;
  intlLocale: string;
  getStatusLabel: (status: string) => string;
};

/**
 * Sadece başlangıç saati (örn. 09:00) — renk randevu durumuna göre; detay tooltip’te.
 */
function ScheduleCalendarEventContent({
  arg,
  intlLocale,
  getStatusLabel,
}: ScheduleCalendarEventContentProps) {
  const row = arg.event.extendedProps.appointment as ScheduleAppointment | undefined;
  const bg = (arg.event.backgroundColor as string) || '#757575';
  const timeLabel = row ? formatAppointmentStartHm(row.starts_at, intlLocale) : arg.timeText;

  const tooltipBody = row ? (
    <Stack spacing={0.35} sx={{ py: 0.25, maxWidth: 280 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
        {formatAppointmentWindow(row.starts_at, row.ends_at, intlLocale)}
      </Typography>
      <Typography variant="caption" display="block">
        {row.service.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {row.staff.display_name}
      </Typography>
      <Typography variant="caption" display="block">
        {row.customer.full_name}
      </Typography>
      {row.customer.phone ? (
        <Typography variant="caption" display="block">
          {row.customer.phone}
        </Typography>
      ) : null}
      <Typography variant="caption" color="text.secondary" display="block">
        {getStatusLabel(row.status)}
      </Typography>
    </Stack>
  ) : (
    arg.event.title
  );

  return (
    <Tooltip
      title={tooltipBody}
      placement="top"
      enterDelay={250}
      enterNextDelay={150}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: 1,
            borderColor: 'divider',
            boxShadow: 3,
            '& .MuiTypography-root': { fontSize: '0.75rem' },
          },
        },
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 0.75,
          boxSizing: 'border-box',
          cursor: 'pointer',
          borderRadius: 1,
          bgcolor: bg,
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.8125rem',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
          boxShadow: (t) => t.shadows[1],
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.08)',
          '&:hover': {
            filter: 'brightness(1.06)',
          },
        }}
      >
        {timeLabel}
      </Box>
    </Tooltip>
  );
}

// ----------------------------------------------------------------------

type NavArrowIcon = 'eva:arrow-ios-back-fill' | 'eva:arrow-ios-forward-fill';

function NavIconButton({ icon, ...other }: { icon: NavArrowIcon } & IconButtonProps) {
  return (
    <IconButton size="small" color="inherit" sx={{ border: 1, borderColor: 'divider' }} {...other}>
      <Iconify icon={icon} width={20} />
    </IconButton>
  );
}
