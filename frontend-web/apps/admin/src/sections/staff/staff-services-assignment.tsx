import type { Staff } from 'src/types/staff';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { putStaffServices } from 'src/api/business-staff';
import { fetchAllServices } from 'src/api/business-services';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  businessId: number;
  staffId: number;
  initialServiceIds: number[];
  onUpdated?: (staff: Staff) => void;
};

export function StaffServicesAssignment({
  businessId,
  staffId,
  initialServiceIds,
  onUpdated,
}: Props) {
  const { t, i18n } = useTranslate('coirendevouz');
  const sortLocale = i18n.language?.startsWith('en') ? 'en' : 'tr';
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<{ id: number; name: string }[]>([]);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(initialServiceIds));

  useEffect(() => {
    setSelected(new Set(initialServiceIds));
  }, [initialServiceIds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      try {
        const all = await fetchAllServices(businessId);
        const opts = all
          .filter((s) => s.is_active)
          .map((s) => ({ id: s.id, name: s.name }))
          .sort((a, b) => a.name.localeCompare(b.name, sortLocale));
        if (!cancelled) {
          setServiceOptions(opts);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, sortLocale]);

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const ids = [...selected].sort((a, b) => a - b);
      const updated = await putStaffServices(businessId, staffId, ids);
      toast.success('Hizmet ataması güncellendi.');
      onUpdated?.(updated);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [businessId, onUpdated, selected, staffId]);

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('staff.servicesSectionTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('staff.servicesSectionDesc')}
      </Typography>

      {loadingList ? (
        <Typography variant="body2" color="text.secondary">
          {t('staff.servicesLoading')}
        </Typography>
      ) : serviceOptions.length === 0 ? (
        <Typography variant="body2" color="warning.main">
          {t('staff.noActiveServices')}
        </Typography>
      ) : (
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          {serviceOptions.map((s) => (
            <FormControlLabel
              key={s.id}
              control={
                <Checkbox
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  name={`service-${s.id}`}
                />
              }
              label={s.name}
            />
          ))}
        </Stack>
      )}

      <Box>
        <LoadingButton
          variant="contained"
          color="secondary"
          loading={saving}
          disabled={loadingList}
          onClick={() => void handleSave()}
        >
          {t('staff.saveServices')}
        </LoadingButton>
      </Box>
    </Card>
  );
}
