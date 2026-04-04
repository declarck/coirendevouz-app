'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { Fragment } from 'react';
import { m } from 'framer-motion';

import Portal from '@mui/material/Portal';
import { styled } from '@mui/material/styles';

import { Logo } from '../logo';

// ----------------------------------------------------------------------

export type SplashScreenProps = React.ComponentProps<'div'> & {
  portal?: boolean;
  sx?: SxProps<Theme>;
  slotProps?: {
    wrapper?: React.ComponentProps<typeof LoadingWrapper>;
  };
};

export function SplashScreen({ portal = true, slotProps, sx, ...other }: SplashScreenProps) {
  const PortalWrapper = portal ? Portal : Fragment;

  const renderLogo = () => (
    <m.div
      animate={{
        scale: [1, 0.96, 1, 0.96, 1],
        opacity: [1, 0.48, 1, 0.48, 1],
      }}
      transition={{
        duration: 2,
        repeatDelay: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Logo disabled isSingle sx={{ width: 128, height: 128 }} />
    </m.div>
  );

  return (
    <PortalWrapper>
      <LoadingWrapper {...slotProps?.wrapper}>
        <LoadingContent sx={sx} {...other}>
          {renderLogo()}
        </LoadingContent>
      </LoadingWrapper>
    </PortalWrapper>
  );
}

// ----------------------------------------------------------------------

const LoadingWrapper = styled('div')({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
});

const LoadingContent = styled('div')(({ theme }) => ({
  right: 0,
  bottom: 0,
  zIndex: 9998,
  flexGrow: 1,
  width: '100%',
  height: '100%',
  display: 'flex',
  position: 'fixed',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.vars.palette.background.default,
}));
