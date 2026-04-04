import type { Staff } from 'src/types/staff';

import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

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
import { fetchAllStaff, deactivateStaff } from 'src/api/business-staff';
import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function StaffListView() {
  const { t } = useTranslate('coirendevouz');
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id;

  const [rows, setRows] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const confirmDialog = useBoolean();
  const [pendingDeactivate, setPendingDeactivate] = useState<Staff | null>(null);

  const load = useCallback(async () => {
    if (businessId == null) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAllStaff(businessId);
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
    (row: Staff) => {
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
      await deactivateStaff(businessId, pendingDeactivate.id);
      toast.success(t('staff.deactivated'));
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
          heading={t('staff.heading')}
          links={[
            { name: t('common.panel'), href: paths.dashboard.root },
            { name: t('staff.heading') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.coirendevouz.staffNew}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('staff.newStaff')}
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
                  <TableCell align="center">{t('staff.colServiceCount')}</TableCell>
                  <TableCell>{t('common.user')}</TableCell>
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
                        title={t('staff.emptyTitle')}
                        description={t('staff.emptyDesc')}
                        sx={{ py: 6 }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{row.display_name}</Typography>
                      </TableCell>
                      <TableCell align="center">{row.service_ids?.length ?? 0}</TableCell>
                      <TableCell>
                        {row.user_id != null ? (
                          <Typography variant="body2">{row.user_id}</Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
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
                            href={paths.dashboard.coirendevouz.staffEdit(row.id)}
                            color="default"
                            aria-label="Düzenle"
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                          {row.is_active ? (
                            <IconButton
                              color="error"
                              aria-label={t('staff.deactivateAria')}
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
        title={t('staff.deactivateTitle')}
        content={
          <Box>
            <Typography variant="body2">
              {t('staff.deactivateContent', { name: pendingDeactivate?.display_name ?? '' })}
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
