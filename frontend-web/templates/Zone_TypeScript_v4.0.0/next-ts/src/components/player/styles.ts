import dynamic from 'next/dynamic';

import { styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export const ReactPlayerRoot = styled(ReactPlayer)({
  width: '100% !important',
  height: '100% !important',
  '& video': {
    objectFit: 'cover',
  },
});
