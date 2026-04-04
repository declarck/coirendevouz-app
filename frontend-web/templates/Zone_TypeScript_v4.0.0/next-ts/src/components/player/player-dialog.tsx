import type { ReactPlayerProps } from 'react-player';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';

import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '../iconify';
import { ReactPlayerRoot } from './styles';

// ----------------------------------------------------------------------

interface Props extends ReactPlayerProps {
  open: boolean;
  videoPath: string;
  onClose: () => void;
}

export function PlayerDialog({ videoPath, open, onClose, ...other }: Props) {
  const loading = useBoolean(true);

  return (
    <Dialog
      fullScreen
      open={open}
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'unset',
          },
        },
      }}
    >
      <IconButton
        size="large"
        onClick={onClose}
        sx={(theme) => ({
          top: 24,
          right: 24,
          zIndex: 9,
          position: 'fixed',
          color: varAlpha(theme.vars.palette.common.whiteChannel, 0.72),
          bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.08),
          '&:hover': {
            bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.16),
          },
        })}
      >
        <Iconify icon="mingcute:close-line" />
      </IconButton>

      {loading.value && (
        <CircularProgress
          sx={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            m: 'auto',
            position: 'absolute',
          }}
        />
      )}

      <ReactPlayerRoot
        url={videoPath}
        playing={!loading.value}
        onReady={loading.onFalse}
        {...other}
      />
    </Dialog>
  );
}
