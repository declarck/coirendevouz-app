'use client';

import { accordionClasses } from '@mui/material/Accordion';

import type { ThemeOptions } from './types';

// ----------------------------------------------------------------------

export const themeOverrides: ThemeOptions = {
  components: {
    MuiTextField: {
      defaultProps: { variant: 'filled' },
    },
    MuiFormControl: {
      defaultProps: { variant: 'filled' },
    },
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
          '&::before': {
            display: 'none',
          },
          '&:last-of-type': {
            borderRadius: 0,
          },
          [`&.${accordionClasses.expanded}`]: {
            margin: 0,
          },
          [`&.${accordionClasses.disabled}`]: {
            backgroundColor: 'transparent',
          },
        }),
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: 0,
          minHeight: 64,
        },
        content: ({ theme }) => ({
          margin: 0,
          padding: theme.spacing(1.5, 0),
          [`&.${accordionClasses.expanded}`]: {
            margin: 0,
          },
        }),
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(0, 0, 2, 0),
        }),
      },
    },
  },
};
