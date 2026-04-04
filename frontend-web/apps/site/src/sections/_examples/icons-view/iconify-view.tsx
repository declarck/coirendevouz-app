import type { BoxProps } from '@mui/material/Box';
import type { IconifyName } from 'src/components/iconify';
import type { SnackbarCloseReason } from '@mui/material/Snackbar';

import { useState, useCallback } from 'react';
import { useCopyToClipboard } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify, iconSets } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function IconifyView() {
  const { copy, copiedText } = useCopyToClipboard();
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleCopy = useCallback(
    (iconMarkup: string) => {
      if (iconMarkup) {
        copy(iconMarkup);
        setOpenSnackbar(true);
      }
    },
    [copy]
  );

  const handleCloseSnackbar = useCallback(
    (event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpenSnackbar(false);
    },
    []
  );

  const renderSnackbar = () => (
    <Snackbar
      open={openSnackbar}
      onClose={handleCloseSnackbar}
      autoHideDuration={6000}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleCloseSnackbar} severity="success" sx={{ minWidth: 240 }}>
        {copiedText}
      </Alert>
    </Snackbar>
  );

  return (
    <>
      {renderSnackbar()}

      <Container sx={{ pt: 3, pb: 10 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Iconify
        </Typography>

        <CustomBreadcrumbs
          links={[
            { name: 'Home', href: '/' },
            { name: 'Components', href: '/components' },
            { name: 'Icons', href: '/components/icons' },
            { name: 'Iconify' },
          ]}
        />

        <Typography variant="body2" sx={{ mt: 2, mb: 5, color: 'text.secondary' }}>
          Iconify icons used in this template.
        </Typography>

        <Grid container spacing={3}>
          {iconSets.map((iconSet) => {
            const hasLink = !['payments', 'socials', 'custom'].includes(iconSet.prefix);

            return (
              <Grid
                key={iconSet.prefix}
                size={{ xs: 12, sm: 6 }}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                }}
              >
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {iconSet.prefix}
                  </Typography>

                  {hasLink && (
                    <IconButton
                      href={`https://icon-sets.iconify.design/${iconSet.prefix}/`}
                      target="_blank"
                      rel="noopener"
                    >
                      <Iconify width={18} icon="carbon:launch" />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>
                  {Object.keys(iconSet.icons).map((icon) => {
                    const iconNameWithPrefix = `${iconSet.prefix}:${icon}` as IconifyName;

                    return (
                      <IconBox
                        key={iconNameWithPrefix}
                        iconName={iconNameWithPrefix}
                        onClick={() => handleCopy(iconNameWithPrefix)}
                      />
                    );
                  })}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </>
  );
}

// ----------------------------------------------------------------------

type IconBoxProps = BoxProps & {
  iconName: IconifyName;
};

function IconBox({ iconName, ...other }: IconBoxProps) {
  return (
    <Tooltip title={iconName}>
      <Box
        sx={(theme) => ({
          width: 48,
          height: 48,
          borderRadius: 1,
          display: 'flex',
          cursor: 'pointer',
          alignItems: 'center',
          color: 'text.secondary',
          justifyContent: 'center',
          bgcolor: 'background.default',
          '&:hover': {
            color: 'text.primary',
            boxShadow: theme.vars.customShadows.z8,
          },
        })}
        {...other}
      >
        <Iconify icon={iconName} width={24} />
      </Box>
    </Tooltip>
  );
}
