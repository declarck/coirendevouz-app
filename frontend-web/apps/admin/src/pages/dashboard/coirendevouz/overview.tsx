import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { OverviewDashboardView } from 'src/sections/overview/overview-dashboard-view';

// ----------------------------------------------------------------------

export default function CoirendevouzOverviewPage() {
  const { t } = useTranslate('coirendevouz');
  const { selectedBusiness } = useBusinessContext();

  return (
    <>
      <title>{t('pageTitles.overview', { app: CONFIG.appName })}</title>

      <DashboardContent maxWidth="xl">
        <Stack spacing={3} sx={{ py: 3 }}>
          <Stack spacing={0.5}>
            <Typography variant="h4">{t('overview.welcome')}</Typography>
            {selectedBusiness ? (
              <Typography variant="subtitle1" color="text.secondary">
                {selectedBusiness.name}
              </Typography>
            ) : null}
          </Stack>

          <OverviewDashboardView />
        </Stack>
      </DashboardContent>
    </>
  );
}
