import ReactPlayer from 'react-player';

import { styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

export const ReactPlayerRoot = styled(ReactPlayer)({
  width: '100% !important',
  height: '100% !important',
  '& video': {
    objectFit: 'cover',
  },
});
