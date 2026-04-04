import type { Service } from 'src/types/service';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useBusinessContext } from 'src/contexts/business/use-business-context';
import {
  fetchAllServices,
  deactivateService,
} from 'src/api/business-services';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

function formatPrice(row: Service, nf: Intl.NumberFormat) {
  const n = typeof row.price === 'number' ? row.price : parseFloat(String(row.price));
  if (!Number.isFinite(n)) {
    return '—';
  }
  return nf.format(n);
}

export function ServicesListView() {
  const { t, currentLang } = useTranslate('coirendevouz');
  const priceFormat = useMemo(
    () =>
      new Intl.NumberFormat(currentLang.numberFormat.code, {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
      }),
    [currentLang.numberFormat.code]
  );

  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id;

  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const confirmDialog = useBoolean();
  const [pendingDeactivate, setPendingDeactivate] = useState<Service | null>(null);

  const load = useCallback(async () => {
    if (businessId == null) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAllServices(businessId);
      setRows(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const openDeactivate = useCallback(
    (row: Service) => {
      setPendingDeactivate(row);
      confirmDialog.onTrue();
    },
    [confirmDialog]
  );

  const handleConfirmDeactivate = useCallback(async () => {
    if (businessId == null || pendingDeactivate == null) {
      return;
    }
    try {
      await deactivateService(businessId, pendingDeactivate.id);
      toast.success(t('services.deactivated'));
      confirmDialog.onFalse();
      setPendingDeactivate(null);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }, [businessId, confirmDialog, load, pendingDeactivate, t]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('services.heading')}
          links={[
            { name: t('common.panel'), href: paths.dashboard.root },
            { name: t('services.heading') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.coirendevouz.serviceNew}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('services.newService')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="medium" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('common.name')}</TableCell>
                  <TableCell align="right">{t('services.colDuration')}</TableCell>
                  <TableCell align="right">{t('services.colPrice')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell align="right" width={120}>
                    {t('common.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        {t('common.loading')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ border: 'none' }}>
                      <EmptyContent
                        title={t('services.emptyTitle')}
                        description={t('services.emptyDesc')}
                        sx={{ py: 6 }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{row.name}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {t('common.durationShort', { minutes: row.duration_minutes })}
                      </TableCell>
                      <TableCell align="right">{formatPrice(row, priceFormat)}</TableCell>
                      <TableCell>
                        {row.is_active ? (
                          <Typography variant="body2" color="success.main">
                            {t('common.active')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            {t('common.inactive')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            component={RouterLink}
                            href={paths.dashboard.coirendevouz.serviceEdit(row.id)}
                            color="default"
                            aria-label={t('services.editAria')}
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                          {row.is_active ? (
                            <IconButton
                              color="error"
                              aria-label={t('services.deactivateAria')}
                              onClick={() => openDeactivate(row)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('services.deactivateTitle')}
        content={
          <Box>
            <Typography variant="body2">
              {t('services.deactivateContent', { name: pendingDeactivate?.name ?? '' })}
            </Typography>
          </Box>
        }
        action={
          <Button variant="contained" color="error" onClick={() => void handleConfirmDeactivate()}>
            {t('common.deactivate')}
          </Button>
        }
      />
    </>
  );
}
